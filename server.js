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
    dostepny: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='dostepny' AND active=1").get().c,
    wydany: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='wydany' AND active=1").get().c,
    serwis: db.prepare("SELECT COUNT(*) c FROM devices WHERE status='serwis' AND active=1").get().c,
    total: db.prepare('SELECT COUNT(*) c FROM devices WHERE active=1').get().c,
    employees: db.prepare('SELECT COUNT(*) c FROM employees WHERE active=1').get().c,
  };
  const recentHistory = db.prepare(`
    SELECT h.*, d.device, d.serial_number, u.full_name AS user_name
    FROM device_history h
    JOIN devices d ON d.id = h.device_id
    LEFT JOIN users u ON u.id = h.user_id
    ORDER BY h.created_at DESC LIMIT 10
  `).all();
  res.render('dashboard', { counts, recentHistory });
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
