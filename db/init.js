// Inicjalizacja bazy danych SQLite - tworzy tabele i konto administratora
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'asset-manager.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ensureTable = (name, ddl) => {
  db.exec(ddl);
};

const ensureColumns = (tableName, columns) => {
  const existing = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const existingNames = new Set(existing.map(column => column.name));

  for (const [columnName, columnType] of columns) {
    if (!existingNames.has(columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
    }
  }
};

ensureTable('users', `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- admin | user
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

ensureTable('employees', `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person TEXT NOT NULL,           -- Person
  department TEXT,                -- Department
  line TEXT,                      -- Line
  info TEXT,                      -- Info
  email TEXT,                     -- do wysylki protokolu
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

ensureTable('device_categories', `
CREATE TABLE IF NOT EXISTS device_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

ensureTable('locations', `
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'office',
  parent_id INTEGER REFERENCES locations(id),
  department TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

ensureTable('devices', `
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device TEXT,
  category_id INTEGER REFERENCES device_categories(id),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  inventory_number TEXT,
  device_type TEXT,
  domena TEXT,
  computer_name TEXT,
  is_using_erp INTEGER DEFAULT 0,
  vnc TEXT,
  vpn TEXT,
  anydesk TEXT,
  mac TEXT,
  ip_address TEXT,
  info TEXT,
  location_id INTEGER REFERENCES locations(id),
  department TEXT,
  room TEXT,
  assigned_to_employee_id INTEGER REFERENCES employees(id),
  assigned_to_location TEXT,
  purpose TEXT,
  data_zakupu TEXT,
  warranty_end_date TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'dostepny',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

ensureColumns('devices', [
  ['category_id', 'INTEGER'],
  ['manufacturer', 'TEXT'],
  ['model', 'TEXT'],
  ['inventory_number', 'TEXT'],
  ['location_id', 'INTEGER'],
  ['department', 'TEXT'],
  ['room', 'TEXT'],
  ['assigned_to_employee_id', 'INTEGER'],
  ['ip_address', 'TEXT'],
  ['assigned_to_location', 'TEXT'],
  ['purpose', 'TEXT'],
  ['warranty_end_date', 'TEXT'],
  ['notes', 'TEXT'],
  ['updated_at', 'TEXT'],
]);

ensureTable('assignments', `
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  data_wydania TEXT,
  data_zdania TEXT,
  status TEXT NOT NULL DEFAULT 'aktywne',
  issue_protocol_id INTEGER,
  return_protocol_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

ensureTable('protocols', `
CREATE TABLE IF NOT EXISTS protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  type TEXT NOT NULL,
  pdf_path TEXT,
  signature_person TEXT,
  signature_issuer TEXT,
  signed_by_user_id INTEGER REFERENCES users(id),
  signed_at TEXT DEFAULT (datetime('now')),
  emailed_to TEXT,
  emailed_at TEXT,
  email_status TEXT
);
`);

ensureTable('device_history', `
CREATE TABLE IF NOT EXISTS device_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id),
  event TEXT NOT NULL,
  details TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM device_categories').get().c;
if (categoryCount === 0) {
  const defaultCategories = [
    ['Laptop', 'laptop'],
    ['Monitor', 'monitor'],
    ['Drukarka', 'drukarka'],
    ['Serwer', 'serwer'],
    ['Switch', 'switch'],
    ['Router', 'router'],
    ['Inne', 'inne']
  ];

  const insertCategory = db.prepare('INSERT INTO device_categories (name, slug) VALUES (?, ?)');
  defaultCategories.forEach(([name, slug]) => insertCategory.run(name, slug));
}

const locationCount = db.prepare('SELECT COUNT(*) AS c FROM locations').get().c;
if (locationCount === 0) {
  const defaultLocations = [
    ['L14', 'office'],
    ['L17', 'office'],
    ['Office', 'office'],
    ['Club', 'office'],
    ['MLP', 'office'],
    ['Zdalne', 'remote'],
    ['MagB', 'warehouse'],
    ['Stock', 'warehouse']
  ];

  const insertLocation = db.prepare('INSERT INTO locations (name, type) VALUES (?, ?)');
  defaultLocations.forEach(([name, type]) => insertLocation.run(name, type));
}

const requiredLocations = [
  ['L14', 'office'],
  ['L17', 'office'],
  ['Office', 'office'],
  ['Club', 'office'],
  ['MLP', 'office'],
  ['Zdalne', 'remote'],
  ['MagB', 'warehouse'],
  ['Stock', 'warehouse']
];
const requiredLocationNames = requiredLocations.map(([name]) => name);
db.prepare(`UPDATE locations SET active = 0 WHERE name NOT IN (${requiredLocationNames.map(() => '?').join(',')})`)
  .run(...requiredLocationNames);
const findLocation = db.prepare('SELECT id FROM locations WHERE name = ?');
const insertLocation = db.prepare('INSERT INTO locations (name, type) VALUES (?, ?)');
const activateLocation = db.prepare('UPDATE locations SET active = 1, type = ? WHERE name = ?');
requiredLocations.forEach(([name, type]) => {
  if (findLocation.get(name)) activateLocation.run(type, name);
  else insertLocation.run(name, type);
});

// Seed domyslnego admina, jesli baza jest pusta
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)'
  ).run('admin', hash, 'Administrator', 'admin');
  console.log('Utworzono domyslne konto: login=admin haslo=admin123 (ZMIEN PO PIERWSZYM LOGOWANIU)');
}

console.log('Baza danych gotowa:', dbPath);
db.close();
