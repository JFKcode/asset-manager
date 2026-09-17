require('dotenv').config();
const express = require('express');
const db = require('../db/database');
const { requireLogin } = require('./auth');
const { generateProtocolPDF } = require('../utils/pdfGenerator');
const { sendProtocolEmail } = require('../utils/mailer');

const router = express.Router();

// Lista wszystkich protokolow
router.get('/', requireLogin, (req, res) => {
  const protocols = db.prepare(`
    SELECT p.*, a.data_wydania, a.data_zdania, e.person, d.device, d.serial_number
    FROM protocols p
    JOIN assignments a ON a.id = p.assignment_id
    JOIN employees e ON e.id = a.employee_id
    JOIN devices d ON d.id = a.device_id
    ORDER BY p.signed_at DESC
  `).all();
  res.render('protocols/list', { protocols });
});

// KROK 1: formularz wydania sprzetu
router.get('/wydanie/nowy', requireLogin, (req, res) => {
  const employees = db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY person').all();
  const devices = db.prepare("SELECT * FROM devices WHERE active = 1 AND status = 'dostepny' ORDER BY device").all();
  res.render('protocol/issue', { employees, devices, companyName: process.env.COMPANY_NAME || 'Firma' });
});

// KROK 2: zapis podpisu, generacja PDF, wysylka maila, zmiana statusu urzadzenia
router.post('/wydanie', requireLogin, async (req, res) => {
  const { employee_id, device_id, data_wydania, signature_person, signature_issuer, send_email, email_override } = req.body;

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id);
  if (!employee || !device) return res.status(400).render('error', { message: 'Nieprawidłowe dane pracownika lub urządzenia.' });
  if (device.status !== 'dostepny') return res.status(400).render('error', { message: 'To urządzenie nie jest obecnie dostępne.' });

  const assignmentInfo = db.prepare("INSERT INTO assignments (device_id, employee_id, data_wydania, status) VALUES (?,?,?, 'aktywne')")
    .run(device_id, employee_id, data_wydania || new Date().toISOString().slice(0, 10));
  const assignmentId = assignmentInfo.lastInsertRowid;

  const protocolInfo = db.prepare('INSERT INTO protocols (assignment_id, type, signature_person, signature_issuer, signed_by_user_id) VALUES (?,?,?,?,?)')
    .run(assignmentId, 'wydanie', signature_person || null, signature_issuer || null, req.session.user.id);
  const protocolId = protocolInfo.lastInsertRowid;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);

  const pdfPath = await generateProtocolPDF({
    type: 'wydanie',
    protocolId,
    employee,
    device,
    assignment,
    signaturePersonB64: signature_person,
    signatureIssuerB64: signature_issuer,
    issuerName: req.session.user.full_name || req.session.user.username,
    companyName: process.env.COMPANY_NAME,
  });

  db.prepare('UPDATE protocols SET pdf_path = ? WHERE id = ?').run(pdfPath, protocolId);
  db.prepare('UPDATE assignments SET issue_protocol_id = ? WHERE id = ?').run(protocolId, assignmentId);
  db.prepare("UPDATE devices SET status = 'wydany' WHERE id = ?").run(device_id);
  db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
    .run(device_id, 'wydano', `Wydano dla: ${employee.person}`, req.session.user.id);

  let emailStatus = 'not_sent';
  const targetEmail = email_override || employee.email;
  if (send_email && targetEmail) {
    try {
      await sendProtocolEmail({
        to: targetEmail,
        subject: `Protokół wydania sprzętu - ${device.device || device.serial_number}`,
        text: `Dzień dobry,\n\nw załączniku przesyłamy protokół wydania sprzętu (${device.device || ''}, nr seryjny: ${device.serial_number || '-'}) dla ${employee.person}.\n\nPozdrawiamy`,
        pdfPath,
      });
      emailStatus = 'ok';
      db.prepare('UPDATE protocols SET emailed_to = ?, emailed_at = datetime("now"), email_status = ? WHERE id = ?')
        .run(targetEmail, emailStatus, protocolId);
    } catch (e) {
      emailStatus = 'error';
      db.prepare('UPDATE protocols SET emailed_to = ?, email_status = ? WHERE id = ?').run(targetEmail, emailStatus, protocolId);
      return res.render('protocol/result', { ok: true, emailError: e.message, protocolId, type: 'wydanie' });
    }
  }

  res.render('protocol/result', { ok: true, emailError: null, protocolId, type: 'wydanie', emailStatus });
});

// KROK 1: formularz zdania sprzetu - lista aktywnych przypisan
router.get('/zdanie/nowy', requireLogin, (req, res) => {
  const assignments = db.prepare(`
    SELECT a.*, e.person, e.department, d.device, d.serial_number, d.device_type
    FROM assignments a
    JOIN employees e ON e.id = a.employee_id
    JOIN devices d ON d.id = a.device_id
    WHERE a.status = 'aktywne'
    ORDER BY a.data_wydania DESC
  `).all();
  res.render('protocol/return', { assignments, companyName: process.env.COMPANY_NAME || 'Firma' });
});

router.post('/zdanie', requireLogin, async (req, res) => {
  const { assignment_id, data_zdania, signature_person, signature_issuer, send_email, email_override } = req.body;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignment_id);
  if (!assignment || assignment.status !== 'aktywne') return res.status(400).render('error', { message: 'Nieprawidłowe lub już zakończone przypisanie.' });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(assignment.employee_id);
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(assignment.device_id);

  const zdaniaDate = data_zdania || new Date().toISOString().slice(0, 10);
  db.prepare("UPDATE assignments SET data_zdania = ?, status = 'zakonczone' WHERE id = ?").run(zdaniaDate, assignment_id);

  const protocolInfo = db.prepare('INSERT INTO protocols (assignment_id, type, signature_person, signature_issuer, signed_by_user_id) VALUES (?,?,?,?,?)')
    .run(assignment_id, 'zdanie', signature_person || null, signature_issuer || null, req.session.user.id);
  const protocolId = protocolInfo.lastInsertRowid;

  const updatedAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignment_id);

  const pdfPath = await generateProtocolPDF({
    type: 'zdanie',
    protocolId,
    employee,
    device,
    assignment: updatedAssignment,
    signaturePersonB64: signature_person,
    signatureIssuerB64: signature_issuer,
    issuerName: req.session.user.full_name || req.session.user.username,
    companyName: process.env.COMPANY_NAME,
  });

  db.prepare('UPDATE protocols SET pdf_path = ? WHERE id = ?').run(pdfPath, protocolId);
  db.prepare('UPDATE assignments SET return_protocol_id = ? WHERE id = ?').run(protocolId, assignment_id);

  // Urzadzenie wraca na stan dostepnych
  db.prepare("UPDATE devices SET status = 'dostepny' WHERE id = ?").run(device.id);
  db.prepare('INSERT INTO device_history (device_id, event, details, user_id) VALUES (?,?,?,?)')
    .run(device.id, 'zdano', `Zdane przez: ${employee.person}. Urządzenie wraca do puli dostępnych.`, req.session.user.id);

  let emailStatus = 'not_sent';
  const targetEmail = email_override || employee.email;
  if (send_email && targetEmail) {
    try {
      await sendProtocolEmail({
        to: targetEmail,
        subject: `Protokół zdania sprzętu - ${device.device || device.serial_number}`,
        text: `Dzień dobry,\n\nw załączniku przesyłamy protokół zdania sprzętu (${device.device || ''}, nr seryjny: ${device.serial_number || '-'}) przez ${employee.person}.\n\nPozdrawiamy`,
        pdfPath,
      });
      emailStatus = 'ok';
      db.prepare('UPDATE protocols SET emailed_to = ?, emailed_at = datetime("now"), email_status = ? WHERE id = ?')
        .run(targetEmail, emailStatus, protocolId);
    } catch (e) {
      emailStatus = 'error';
      db.prepare('UPDATE protocols SET emailed_to = ?, email_status = ? WHERE id = ?').run(targetEmail, emailStatus, protocolId);
      return res.render('protocol/result', { ok: true, emailError: e.message, protocolId, type: 'zdanie' });
    }
  }

  res.render('protocol/result', { ok: true, emailError: null, protocolId, type: 'zdanie', emailStatus });
});

// Pobranie / podglad PDF
router.get('/:id/pdf', requireLogin, (req, res) => {
  const protocol = db.prepare('SELECT * FROM protocols WHERE id = ?').get(req.params.id);
  if (!protocol || !protocol.pdf_path) return res.status(404).render('error', { message: 'Nie znaleziono pliku PDF.' });
  res.sendFile(protocol.pdf_path);
});

// Ponowna wysylka maila
router.post('/:id/wyslij-ponownie', requireLogin, async (req, res) => {
  const protocol = db.prepare('SELECT * FROM protocols WHERE id = ?').get(req.params.id);
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(protocol.assignment_id);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(assignment.employee_id);
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(assignment.device_id);
  const targetEmail = req.body.email_override || protocol.emailed_to || employee.email;

  try {
    await sendProtocolEmail({
      to: targetEmail,
      subject: `Protokół ${protocol.type === 'wydanie' ? 'wydania' : 'zdania'} sprzętu - ${device.device || device.serial_number}`,
      text: `Dzień dobry,\n\nw załączniku przesyłamy ponownie protokół.\n\nPozdrawiamy`,
      pdfPath: protocol.pdf_path,
    });
    db.prepare('UPDATE protocols SET emailed_to = ?, emailed_at = datetime("now"), email_status = "ok" WHERE id = ?').run(targetEmail, protocol.id);
  } catch (e) {
    db.prepare('UPDATE protocols SET email_status = "error" WHERE id = ?').run(protocol.id);
  }
  res.redirect('/protokoly');
});

module.exports = router;
