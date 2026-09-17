const express = require('express');
const db = require('../db/database');
const { requireLogin } = require('./auth');

const router = express.Router();

// Lista urzadzen z filtrowaniem
router.get('/', requireLogin, (req, res) => {
  const { q, status, category_id, location_id, department } = req.query;
  let sql = `SELECT d.*, c.name AS category_name, l.name AS location_name
    FROM devices d
    LEFT JOIN device_categories c ON c.id = d.category_id
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE d.active = 1`;
  const params = [];

  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  if (category_id) { sql += ' AND d.category_id = ?'; params.push(category_id); }
  if (location_id) { sql += ' AND d.location_id = ?'; params.push(location_id); }
  if (department) { sql += ' AND d.department LIKE ?'; params.push(`%${department}%`); }
  if (q) {
    sql += ` AND (d.device LIKE ? OR d.serial_number LIKE ? OR d.computer_name LIKE ? OR d.device_type LIKE ? OR d.model LIKE ? OR d.manufacturer LIKE ? OR d.inventory_number LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like);
  }

  sql += ' ORDER BY d.created_at DESC';
  const devices = db.prepare(sql).all(...params);
  const categories = db.prepare('SELECT * FROM device_categories ORDER BY name').all();
  const locations = db.prepare('SELECT * FROM locations WHERE active = 1 ORDER BY name').all();

  res.render('devices/list', {
    devices,
    categories,
    locations,
    q: q || '',
    status: status || '',
    category_id: category_id || '',
    location_id: location_id || '',
    department: department || ''
  });
});

router.get('/nowy', requireLogin, (req, res) => {
  res.render('devices/form', { device: {}, action: '/urzadzenia' });
});

router.post('/', requireLogin, (req, res) => {
  const b = req.body;
  const info = db.prepare(`INSERT INTO devices
    (device, category_id, manufacturer, model, serial_number, inventory_number, device_type, domena, computer_name,
     is_using_erp, vnc, vpn, anydesk, mac, info, location_id, department, room, assigned_to_employee_id,
     assigned_to_location, purpose, data_zakupu, warranty_end_date, notes, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'dostepny')`).run(
    b.device,
    b.category_id || null,
    b.manufacturer || null,
    b.model || null,
    b.serial_number || null,
    b.inventory_number || null,
    b.device_type || null,
    b.domena || null,
    b.computer_name || null,
    b.is_using_erp ? 1 : 0,
    b.vnc || null,
    b.vpn || null,
    b.anydesk || null,
    b.mac || null,
    b.info || null,
    b.location_id || null,
    b.department || null,
    b.room || null,
    b.assigned_to_employee_id || null,
    b.assigned_to_location || null,
    b.purpose || null,
    b.data_zakupu || null,
    b.warranty_end_date || null,
    b.notes || null
  );
  db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
    .run(info.lastInsertRowid, 'utworzono', 'Dodano urządzenie do systemu', req.session.user.id);
  res.redirect('/urzadzenia');
});

router.get('/:id', requireLogin, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });
  const history = db.prepare('SELECT h.*, u.full_name AS user_name FROM device_history h LEFT JOIN users u ON u.id = h.user_id WHERE device_id = ? ORDER BY h.created_at DESC').all(req.params.id);
  const assignments = db.prepare(`SELECT a.*, e.person, e.department FROM assignments a
    JOIN employees e ON e.id = a.employee_id WHERE a.device_id = ? ORDER BY a.created_at DESC`).all(req.params.id);
  res.render('devices/view', { device, history, assignments });
});

router.get('/:id/edytuj', requireLogin, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });
  res.render('devices/form', { device, action: `/urzadzenia/${device.id}?_method=PUT` });
});

router.put('/:id', requireLogin, (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE devices SET device=?, category_id=?, manufacturer=?, model=?, serial_number=?, inventory_number=?,
    device_type=?, domena=?, computer_name=?, is_using_erp=?, vnc=?, vpn=?, anydesk=?, mac=?, info=?,
    location_id=?, department=?, room=?, assigned_to_employee_id=?, assigned_to_location=?, purpose=?,
    data_zakupu=?, warranty_end_date=?, notes=? WHERE id=?`).run(
    b.device,
    b.category_id || null,
    b.manufacturer || null,
    b.model || null,
    b.serial_number || null,
    b.inventory_number || null,
    b.device_type || null,
    b.domena || null,
    b.computer_name || null,
    b.is_using_erp ? 1 : 0,
    b.vnc || null,
    b.vpn || null,
    b.anydesk || null,
    b.mac || null,
    b.info || null,
    b.location_id || null,
    b.department || null,
    b.room || null,
    b.assigned_to_employee_id || null,
    b.assigned_to_location || null,
    b.purpose || null,
    b.data_zakupu || null,
    b.warranty_end_date || null,
    b.notes || null,
    req.params.id
  );
  db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
    .run(req.params.id, 'edycja', 'Zaktualizowano dane urządzenia', req.session.user.id);
  res.redirect(`/urzadzenia/${req.params.id}`);
});

router.put('/:id/status', requireLogin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE devices SET status = ? WHERE id = ?').run(status, req.params.id);
  db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
    .run(req.params.id, 'zmiana_statusu', `Status zmieniony na: ${status}`, req.session.user.id);
  res.redirect(`/urzadzenia/${req.params.id}`);
});

router.delete('/:id', requireLogin, (req, res) => {
  db.prepare('UPDATE devices SET active = 0 WHERE id = ?').run(req.params.id);
  res.redirect('/urzadzenia');
});

module.exports = router;
