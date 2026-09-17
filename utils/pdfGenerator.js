const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const STORAGE_DIR = path.join(__dirname, '..', 'storage', 'protocols');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

function b64ToBuffer(dataUrl) {
  if (!dataUrl) return null;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

/**
 * Generuje PDF protokolu wydania lub zdania sprzetu.
 * @returns {string} pelna sciezka do wygenerowanego pliku PDF
 */
function generateProtocolPDF({ type, protocolId, employee, device, assignment, signaturePersonB64, signatureIssuerB64, issuerName, companyName }) {
  const fileName = `protokol_${type}_${protocolId}_${Date.now()}.pdf`;
  const filePath = path.join(STORAGE_DIR, fileName);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const title = type === 'wydanie' ? 'PROTOKÓŁ WYDANIA SPRZĘTU' : 'PROTOKÓŁ ZDANIA SPRZĘTU';

  doc.fontSize(16).font('Helvetica-Bold').text(companyName || 'Firma', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).text(title, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(10).font('Helvetica').text(`Nr protokołu: ${protocolId}`);
  doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Dane pracownika');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Osoba: ${employee.person || '-'}`);
  doc.text(`Dział: ${employee.department || '-'}`);
  doc.text(`Linia: ${employee.line || '-'}`);
  if (employee.info) doc.text(`Info: ${employee.info}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Dane urządzenia');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Urządzenie: ${device.device || '-'}`);
  doc.text(`Typ urządzenia: ${device.device_type || '-'}`);
  doc.text(`Nr seryjny / Service Tag: ${device.serial_number || '-'}`);
  doc.text(`Nazwa komputera: ${device.computer_name || '-'}`);
  doc.text(`Domena: ${device.domena || '-'}`);
  doc.text(`MAC: ${device.mac || '-'}`);
  doc.text(`VPN: ${device.vpn || '-'}   VNC: ${device.vnc || '-'}   AnyDesk: ${device.anydesk || '-'}`);
  doc.text(`Korzysta z ERP: ${device.is_using_erp ? 'Tak' : 'Nie'}`);
  if (device.info) doc.text(`Info: ${device.info}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Terminy');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Data wydania: ${assignment.data_wydania || '-'}`);
  if (type === 'zdanie') doc.text(`Data zdania: ${assignment.data_zdania || '-'}`);
  doc.moveDown(1.2);

  const statementText = type === 'wydanie'
    ? 'Potwierdzam odbiór wyżej wymienionego sprzętu w stanie technicznym umożliwiającym jego prawidłowe użytkowanie. Zobowiązuję się do dbania o powierzony sprzęt oraz zwrotu go w stanie niepogorszonym.'
    : 'Potwierdzam zdanie wyżej wymienionego sprzętu. Sprzęt został zwrócony i przyjęty przez osobę odbierającą.';
  doc.fontSize(10).text(statementText, { align: 'justify' });
  doc.moveDown(1.5);

  const sigY = doc.y;
  const sigWidth = 200;
  const sigHeight = 70;

  doc.font('Helvetica').fontSize(9);
  doc.text('Podpis pracownika:', 50, sigY);
  doc.text('Podpis wydającego / odbierającego:', 320, sigY);

  const sigPersonBuf = b64ToBuffer(signaturePersonB64);
  if (sigPersonBuf) {
    try { doc.image(sigPersonBuf, 50, sigY + 15, { width: sigWidth, height: sigHeight, fit: [sigWidth, sigHeight] }); } catch (e) {}
  }
  const sigIssuerBuf = b64ToBuffer(signatureIssuerB64);
  if (sigIssuerBuf) {
    try { doc.image(sigIssuerBuf, 320, sigY + 15, { width: sigWidth, height: sigHeight, fit: [sigWidth, sigHeight] }); } catch (e) {}
  }

  doc.moveTo(50, sigY + 90).lineTo(250, sigY + 90).stroke();
  doc.moveTo(320, sigY + 90).lineTo(520, sigY + 90).stroke();

  doc.fontSize(8).text(employee.person || '', 50, sigY + 94);
  doc.fontSize(8).text(issuerName || '', 320, sigY + 94);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateProtocolPDF, STORAGE_DIR };
