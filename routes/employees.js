const express = require('express');
const db = require('../db/database');
const { requireLogin } = require('./auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT * FROM employees WHERE active = 1';
  const params = [];
  if (q) {
    sql += ' AND (person LIKE ? OR department LIKE ? OR line LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY person';
  const employees = db.prepare(sql).all(...params);
  res.render('employees/list', { employees, q: q || '' });
});

router.get('/nowy', requireLogin, (req, res) => {
  res.render('employees/form', { employee: {}, action: '/pracownicy' });
});

router.post('/', requireLogin, (req, res) => {
  const b = req.body;
  db.prepare('INSERT INTO employees (person, department, line, info, email) VALUES (?,?,?,?,?)')
    .run(b.person, b.department, b.line, b.info, b.email);
  res.redirect('/pracownicy');
});

router.get('/:id/edytuj', requireLogin, (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).render('error', { message: 'Nie znaleziono pracownika.' });
  res.render('employees/form', { employee, action: `/pracownicy/${employee.id}?_method=PUT` });
});

router.put('/:id', requireLogin, (req, res) => {
  const b = req.body;
  db.prepare('UPDATE employees SET person=?, department=?, line=?, info=?, email=? WHERE id=?')
    .run(b.person, b.department, b.line, b.info, b.email, req.params.id);
  res.redirect('/pracownicy');
});

router.get('/:id', requireLogin, (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).render('error', { message: 'Nie znaleziono pracownika.' });
  const assignments = db.prepare(`SELECT a.*, d.device, d.serial_number FROM assignments a
    JOIN devices d ON d.id = a.device_id WHERE a.employee_id = ? ORDER BY a.created_at DESC`).all(req.params.id);
  res.render('employees/view', { employee, assignments });
});

router.delete('/:id', requireLogin, (req, res) => {
  db.prepare('UPDATE employees SET active = 0 WHERE id = ?').run(req.params.id);
  res.redirect('/pracownicy');
});

module.exports = router;
