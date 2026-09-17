const express = require('express');
const db = require('../db/database');
const { requireLogin } = require('./auth');

const router = express.Router();

// Lista urzadzen z filtrowaniem
router.get('/', requireLogin, (req, res) => {
  const { q, status, category_id, location_id, department, employee_id } = req.query;
  const active = ['0', 'all'].includes(req.query.active) ? req.query.active : '1';
  let sql = `SELECT d.*, c.name AS category_name, l.name AS location_name
    FROM devices d
    LEFT JOIN device_categories c ON c.id = d.category_id
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE 1 = 1`;
  const params = [];

  if (active !== 'all') { sql += ' AND d.active = ?'; params.push(Number(active)); }
  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  if (category_id) { sql += ' AND d.category_id = ?'; params.push(category_id); }
  if (location_id) { sql += ' AND d.location_id = ?'; params.push(location_id); }
  if (department) { sql += ' AND d.department LIKE ?'; params.push(`%${department}%`); }
  if (employee_id) { sql += ' AND d.assigned_to_employee_id = ?'; params.push(employee_id); }
  if (q) {
    sql += ` AND (d.device LIKE ? OR d.serial_number LIKE ? OR d.computer_name LIKE ? OR d.device_type LIKE ? OR d.model LIKE ? OR d.manufacturer LIKE ? OR d.inventory_number LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like);
  }

  sql += ' ORDER BY d.created_at DESC';
  const devices = db.prepare(sql).all(...params);
  const categories = db.prepare('SELECT * FROM device_categories ORDER BY name').all();
  const locations = db.prepare('SELECT * FROM locations WHERE active = 1 ORDER BY name').all();
  const employees = db.prepare('SELECT id, person FROM employees WHERE active = 1 ORDER BY person').all();

  res.render('devices/list', {
    devices,
    categories,
    locations,
    employees,
    q: q || '',
    status: status || '',
    category_id: category_id || '',
    location_id: location_id || '',
    department: department || '',
    employee_id: employee_id || '',
    active
  });
});

router.get('/nowy', requireLogin, (req, res) => {
  const categories = db.prepare('SELECT * FROM device_categories ORDER BY name').all();
  const locations = db.prepare('SELECT * FROM locations WHERE active = 1 ORDER BY name').all();
  res.render('devices/form', { device: {}, action: '/urzadzenia', categories, locations });
});

router.post('/', requireLogin, (req, res) => {
  const b = req.body;
  const info = db.prepare(`INSERT INTO devices
    (device, category_id, manufacturer, model, serial_number, inventory_number, device_type, domena, computer_name,
     is_using_erp, vnc, vpn, anydesk, mac, info, location_id, department, room, assigned_to_employee_id,
     assigned_to_location, purpose, data_zakupu, warranty_end_date, notes, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'dostepny')`).run(
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
  const device = db.prepare(`SELECT d.*, c.name AS category_name, l.name AS location_name
    FROM devices d
    LEFT JOIN device_categories c ON c.id = d.category_id
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE d.id = ?`).get(req.params.id);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });
  const history = db.prepare('SELECT h.*, u.full_name AS user_name FROM device_history h LEFT JOIN users u ON u.id = h.user_id WHERE device_id = ? ORDER BY h.created_at DESC').all(req.params.id);
  const assignments = db.prepare(`SELECT a.*, e.person, e.department FROM assignments a
    JOIN employees e ON e.id = a.employee_id WHERE a.device_id = ? ORDER BY a.created_at DESC`).all(req.params.id);
  const employees = db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY person').all();
  res.render('devices/view', { device, history, assignments, employees });
});

router.get('/:id/edytuj', requireLogin, (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });
  const categories = db.prepare('SELECT * FROM device_categories ORDER BY name').all();
  const locations = db.prepare('SELECT * FROM locations WHERE active = 1 ORDER BY name').all();
  res.render('devices/form', { device, action: `/urzadzenia/${device.id}?_method=PUT`, categories, locations });
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

router.post('/:id/przypisz', requireLogin, (req, res) => {
  const { employee_id, department, room, assigned_to_location, purpose } = req.body;
  const deviceId = req.params.id;

  if (employee_id) {
    db.prepare('UPDATE assignments SET status = ?, data_zdania = ? WHERE device_id = ? AND status = ?')
      .run('zakonczone', new Date().toISOString().slice(0, 10), deviceId, 'aktywne');

    db.prepare(`INSERT INTO assignments (device_id, employee_id, data_wydania, status)
      VALUES (?, ?, ?, 'aktywne')`).run(deviceId, employee_id, new Date().toISOString().slice(0, 10));

    db.prepare('UPDATE devices SET status = ?, assigned_to_employee_id = ?, department = ?, room = ?, assigned_to_location = ?, purpose = ? WHERE id = ?')
      .run('wydany', employee_id, department || null, room || null, assigned_to_location || null, purpose || null, deviceId);

    db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
      .run(deviceId, 'przypisanie', `Przypisano urządzenie do pracownika (ID: ${employee_id})`, req.session.user.id);
  } else {
    db.prepare('UPDATE devices SET assigned_to_employee_id = ?, department = ?, room = ?, assigned_to_location = ?, purpose = ? WHERE id = ?')
      .run(null, department || null, room || null, assigned_to_location || null, purpose || null, deviceId);

    db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
      .run(deviceId, 'lokalizacja', 'Zaktualizowano lokalizację i przeznaczenie urządzenia', req.session.user.id);
  }

  res.redirect(`/urzadzenia/${deviceId}`);
});

router.post('/:id/zwrot', requireLogin, (req, res) => {
  const deviceId = req.params.id;
  const device = db.prepare('SELECT * FROM devices WHERE id = ? AND active = 1').get(deviceId);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });

  const returnDate = new Date().toISOString().slice(0, 10);
  const details = req.body.details || 'Urządzenie zwrócone do ewidencji';

  const returnDevice = db.transaction(() => {
    const activeAssignment = db.prepare(`
      UPDATE assignments
      SET status = 'zakonczone', data_zdania = ?
      WHERE device_id = ? AND status = 'aktywne'
    `).run(returnDate, deviceId);

    db.prepare(`
      UPDATE devices
      SET status = 'dostepny', assigned_to_employee_id = NULL, assigned_to_location = NULL
      WHERE id = ?
    `).run(deviceId);

    db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
      .run(deviceId, 'zwrot', `${details}${activeAssignment.changes ? ` (zakończono przypisanie: ${activeAssignment.changes})` : ''}`, req.session.user.id);
  });

  returnDevice();
  res.redirect(`/urzadzenia/${deviceId}`);
});

router.post('/:id/utylizacja', requireLogin, (req, res) => {
  const deviceId = req.params.id;
  const device = db.prepare('SELECT * FROM devices WHERE id = ? AND active = 1').get(deviceId);
  if (!device) return res.status(404).render('error', { message: 'Nie znaleziono urządzenia.' });

  const reason = req.body.reason || 'Urządzenie wycofane z użytkowania i przekazane do utylizacji';
  const eventDate = new Date().toISOString().slice(0, 10);

  const disposeDevice = db.transaction(() => {
    db.prepare(`
      UPDATE assignments
      SET status = 'zakonczone', data_zdania = ?
      WHERE device_id = ? AND status = 'aktywne'
    `).run(eventDate, deviceId);

    db.prepare(`
      UPDATE devices
      SET status = 'utylizacja', assigned_to_employee_id = NULL, assigned_to_location = NULL
      WHERE id = ?
    `).run(deviceId);

    db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
      .run(deviceId, 'utylizacja', reason, req.session.user.id);
  });

  disposeDevice();
  res.redirect(`/urzadzenia/${deviceId}`);
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
