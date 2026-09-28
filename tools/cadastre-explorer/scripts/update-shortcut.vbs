Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set oLink = WshShell.CreateShortcut(strDesktop & "\REAL intel.lnk")
oLink.TargetPath = "C:\Dev\real-evolution-website\tools\cadastre-explorer\REAL-Cadastre.bat"
oLink.WorkingDirectory = "C:\Dev\real-evolution-website\tools\cadastre-explorer"
oLink.Description = "REAL intel - Commercial Land & Property Intelligence"
oLink.IconLocation = "C:\Dev\real-evolution-website\tools\cadastre-explorer\public\cadastre.ico,0"
oLink.Save
WScript.Echo "Shortcut updated."
