// Deploy to tiiny.host — no account needed
const fs = require('fs');
const https = require('https');
const path = require('path');
const crypto = require('crypto');

const zipPath = path.join(__dirname, 'vectorheart.zip');
const zipData = fs.readFileSync(zipPath);
const projectName = 'vectorheart-' + crypto.randomBytes(3).toString('hex');

const boundary = '----FormBoundary' + crypto.randomBytes(8).toString('hex');

// Build multipart form body
const parts = [];

// field: project-name
parts.push(
  `--${boundary}\r\nContent-Disposition: form-data; name="project-name"\r\n\r\n${projectName}`
);

// field: email (tiiny requires it but doesn't verify)
parts.push(
  `--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\nvectorheart@generative.art`
);

// file: the zip
const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="vectorheart.zip"\r\nContent-Type: application/zip\r\n\r\n`;
const closing = `\r\n--${boundary}--\r\n`;

const bodyParts = Buffer.concat([
  Buffer.from(parts.join('\r\n') + '\r\n'),
  Buffer.from(fileHeader),
  zipData,
  Buffer.from(closing)
]);

const options = {
  hostname: 'tiiny.host',
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': bodyParts.length,
  }
};

console.log('Desplegando en tiiny.host...');
console.log('Proyecto:', projectName);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Respuesta:', body.substring(0, 800));
    try {
      const data = JSON.parse(body);
      if (data.link || data.url) {
        console.log('\n✅ URL pública:', data.link || data.url);
      } else if (res.statusCode === 200) {
        console.log('\n✅ URL pública: https://' + projectName + '.tiiny.site');
      }
    } catch(e) {}
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(bodyParts);
req.end();
