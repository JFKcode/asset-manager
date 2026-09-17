const assert = require('assert');
const db = require('../db/database');

const today = new Date().toISOString().slice(0, 10);
const category = db.prepare('SELECT id FROM device_categories ORDER BY id LIMIT 1').get();
const location = db.prepare('SELECT id FROM locations WHERE active = 1 ORDER BY id LIMIT 1').get();
const employee = db.prepare('SELECT id FROM employees WHERE active = 1 ORDER BY id LIMIT 1').get();

if (!category || !location || !employee) {
  throw new Error('Smoke test wymaga co najmniej kategorii, lokalizacji i pracownika.');
}

try {
  db.transaction(() => {
    const device = db.prepare(`
      INSERT INTO devices
        (device, category_id, serial_number, inventory_number, location_id, status)
      VALUES (?, ?, ?, ?, ?, 'dostepny')
    `).run(
      'Smoke test device',
      category.id,
      `SMOKE-${Date.now()}`,
      `SMOKE-${Date.now()}`,
      location.id
    );
    const deviceId = device.lastInsertRowid;

    assert.strictEqual(
      db.prepare('SELECT status FROM devices WHERE id = ?').get(deviceId).status,
      'dostepny'
    );

    db.prepare(`
      INSERT INTO assignments (device_id, employee_id, data_wydania, status)
      VALUES (?, ?, ?, 'aktywne')
    `).run(deviceId, employee.id, today);
    db.prepare(`
      UPDATE devices
      SET status = 'wydany', assigned_to_employee_id = ?
      WHERE id = ?
    `).run(employee.id, deviceId);

    assert.strictEqual(
      db.prepare('SELECT status FROM devices WHERE id = ?').get(deviceId).status,
      'wydany'
    );
    assert.strictEqual(
      db.prepare("SELECT COUNT(*) AS count FROM assignments WHERE device_id = ? AND status = 'aktywne'").get(deviceId).count,
      1
    );

    db.prepare(`
      UPDATE assignments
      SET status = 'zakonczone', data_zdania = ?
      WHERE device_id = ? AND status = 'aktywne'
    `).run(today, deviceId);
    db.prepare(`
      UPDATE devices
      SET status = 'dostepny', assigned_to_employee_id = NULL
      WHERE id = ?
    `).run(deviceId);

    const returnedDevice = db.prepare('SELECT status, assigned_to_employee_id FROM devices WHERE id = ?').get(deviceId);
    assert.strictEqual(returnedDevice.status, 'dostepny');
    assert.strictEqual(returnedDevice.assigned_to_employee_id, null);
    assert.strictEqual(
      db.prepare("SELECT COUNT(*) AS count FROM assignments WHERE device_id = ? AND status = 'aktywne'").get(deviceId).count,
      0
    );

    db.prepare("UPDATE devices SET status = 'utylizacja' WHERE id = ?").run(deviceId);
    assert.strictEqual(
      db.prepare('SELECT status FROM devices WHERE id = ?').get(deviceId).status,
      'utylizacja'
    );

    db.prepare('UPDATE devices SET active = 0 WHERE id = ?').run(deviceId);
    assert.strictEqual(
      db.prepare('SELECT active FROM devices WHERE id = ?').get(deviceId).active,
      0
    );

    throw new Error('__ROLLBACK_SMOKE_TEST__');
  })();
} catch (error) {
  if (error.message !== '__ROLLBACK_SMOKE_TEST__') {
    throw error;
  }
}

console.log('Smoke test OK: dodanie, przypisanie, zwrot, utylizacja i deaktywacja.');
