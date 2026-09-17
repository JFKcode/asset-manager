require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const SqliteStoreFactory = require('better-sqlite3-session-store');
const SqliteStore = SqliteStoreFactory(session);
const Database = require('better-sqlite3');
const methodOverride = require('method-override');

const db = require('./db/database');
const { router: authRouter, requireLogin } = require('./routes/auth');
const devicesRouter = require('./routes/devices');
const employeesRouter = require('./routes/employees');
const protocolsRouter = require('./routes/protocols');

// Upewnij sie, ze baza istnieje (uruchamia init przy pierwszym starcie)
const dbFile = path.join(__dirname, 'data', 'asset-manager.db');
if (!fs.existsSync(dbFile)) {
  require('./db/init');
}

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionDb = new Database(path.join(__dirname, 'data', 'sessions.db'));
app.use(session({
  store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 1000 * 60 * 60 } }),
  secret: process.env.SESSION_SECRET || 'zmien_ten_sekret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 }, // 12h
}));

// Udostepnij dane sesji we wszystkich widokach
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.companyName = process.env.COMPANY_NAME || 'Firma';
  next();
});

app.use('/', authRouter);

app.get('/', requireLogin, (req, res) => {
  const counts = {
    total: db.prepare('SELECT COUNT(*) c FROM devices WHERE active=1').get().c,
    dostepny: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='dostepny' AND active=1").get().c,
    wydany: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='wydany' AND active=1").get().c,
    serwis: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='serwis' AND active=1").get().c,
    zezlomowany: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='zezlomowany' AND active=1").get().c,
    utylizacja: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='utylizacja' AND active=1").get().c,
    employees: db.prepare('SELECT COUNT(*) c FROM employees WHERE active=1').get().c,
    laptops: db.prepare(`SELECT COUNT(*) c FROM devices d JOIN device_categories dc ON dc.id = d.category_id WHERE dc.slug='laptop' AND d.active=1`).get().c,
    monitors: db.prepare(`SELECT COUNT(*) c FROM devices d JOIN device_categories dc ON dc.id = d.category_id WHERE dc.slug='monitor' AND d.active=1`).get().c,
    printers: db.prepare(`SELECT COUNT(*) c FROM devices d JOIN device_categories dc ON dc.id = d.category_id WHERE dc.slug='drukarka' AND d.active=1`).get().c,
    servers: db.prepare(`SELECT COUNT(*) c FROM devices d JOIN device_categories dc ON dc.id = d.category_id WHERE dc.slug='serwer' AND d.active=1`).get().c,
    switches: db.prepare(`SELECT COUNT(*) c FROM devices d JOIN device_categories dc ON dc.id = d.category_id WHERE dc.slug='switch' AND d.active=1`).get().c,
  };

  const recentHistory = db.prepare(`
    SELECT h.*, d.device, d.serial_number, u.full_name AS user_name
    FROM device_history h
    JOIN devices d ON d.id = h.device_id
    LEFT JOIN users u ON u.id = h.user_id
    ORDER BY h.created_at DESC LIMIT 10
  `).all();

  const categoryBreakdown = db.prepare(`
    SELECT dc.id AS category_id, dc.name AS category, dc.slug AS category_slug, COUNT(d.id) AS total
    FROM device_categories dc
    LEFT JOIN devices d ON d.category_id = dc.id AND d.active = 1
    GROUP BY dc.id, dc.name
    ORDER BY total DESC, dc.name ASC
  `).all();

  const locationBreakdown = db.prepare(`
    SELECT l.id AS location_id, l.name AS location, COUNT(d.id) AS total
    FROM locations l
    LEFT JOIN devices d ON d.location_id = l.id AND d.active = 1
    WHERE l.active = 1
    GROUP BY l.id, l.name
    ORDER BY total DESC, l.name ASC
  `).all();

  res.render('dashboard', { counts, recentHistory, categoryBreakdown, locationBreakdown });
});

app.get('/raporty', requireLogin, (req, res) => {
  const { department, location_id, category_id, status } = req.query;
  const deviceFilters = ['d.active = 1'];
  const filterParams = [];

  if (department) {
    deviceFilters.push('d.department = ?');
    filterParams.push(department);
  }
  if (location_id) {
    deviceFilters.push('d.location_id = ?');
    filterParams.push(location_id);
  }
  if (category_id) {
    deviceFilters.push('d.category_id = ?');
    filterParams.push(category_id);
  }
  if (status) {
    deviceFilters.push('d.status = ?');
    filterParams.push(status);
  }

  const deviceFilterSql = deviceFilters.join(' AND ');
  const employeeReport = db.prepare(`
    SELECT e.id, e.person, e.department, COUNT(d.id) AS device_count
    FROM employees e
    LEFT JOIN devices d ON d.assigned_to_employee_id = e.id AND ${deviceFilterSql}
    WHERE e.active = 1
    GROUP BY e.id, e.person, e.department
    ORDER BY e.person ASC
  `).all(...filterParams);

  const locationReport = db.prepare(`
    SELECT l.id AS location_id, l.name AS location_name, l.type, COUNT(d.id) AS device_count
    FROM locations l
    LEFT JOIN devices d ON d.location_id = l.id AND ${deviceFilterSql}
    WHERE l.active = 1
    GROUP BY l.id, l.name, l.type
    ORDER BY l.name ASC
  `).all(...filterParams);

  const departmentReport = db.prepare(`
    SELECT department, COUNT(*) AS device_count
    FROM devices
    WHERE ${deviceFilterSql} AND department IS NOT NULL AND department != ''
    GROUP BY department
    ORDER BY device_count DESC, department ASC
  `).all(...filterParams);

  const categories = db.prepare('SELECT * FROM device_categories ORDER BY name').all();
  const locations = db.prepare('SELECT * FROM locations WHERE active = 1 ORDER BY name').all();
  const departments = db.prepare(`
    SELECT DISTINCT department FROM devices
    WHERE active = 1 AND department IS NOT NULL AND department != ''
    ORDER BY department ASC
  `).all();

  res.render('reports', {
    employeeReport,
    locationReport,
    departmentReport,
    categories,
    locations,
    departments,
    filters: {
      department: department || '',
      location_id: location_id || '',
      category_id: category_id || '',
      status: status || ''
    }
  });
});

app.use('/urzadzenia', devicesRouter);
app.use('/pracownicy', employeesRouter);
app.use('/protokoly', protocolsRouter);

app.use((req, res) => {
  res.status(404).render('error', { message: 'Nie znaleziono strony.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Asset Manager działa na porcie ${PORT}: http://localhost:${PORT}`);
});
