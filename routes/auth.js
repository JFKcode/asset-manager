const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Brak uprawnień administratora.' });
  }
  next();
}

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.render('login', { error: 'Nieprawidłowy login lub hasło.' });
  }
  req.session.user = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/uzytkownicy', requireLogin, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, role, active FROM users ORDER BY username').all();
  res.render('users', { users, error: null });
});

router.post('/uzytkownicy', requireLogin, requireAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)')
      .run(username, hash, full_name, role === 'admin' ? 'admin' : 'user');
    res.redirect('/uzytkownicy');
  } catch (e) {
    const users = db.prepare('SELECT id, username, full_name, role, active FROM users ORDER BY username').all();
    res.render('users', { users, error: 'Błąd: ' + e.message });
  }
});

router.post('/uzytkownicy/:id/toggle', requireLogin, requireAdmin, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (u) db.prepare('UPDATE users SET active = ? WHERE id = ?').run(u.active ? 0 : 1, u.id);
  res.redirect('/uzytkownicy');
});

module.exports = { router, requireLogin, requireAdmin };
