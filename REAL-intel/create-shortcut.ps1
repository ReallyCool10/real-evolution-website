$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "REAL intel.lnk"

# Remove legacy shortcut if it exists
$OldShortcut = Join-Path $DesktopPath "REAL Cadastre.lnk"
if (Test-Path $OldShortcut) {
    Remove-Item $OldShortcut -Force -ErrorAction SilentlyContinue
}

$AppDir = $PSScriptRoot
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $AppDir "REAL-Cadastre.bat"
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.IconLocation = (Join-Path $AppDir "public\cadastre.ico") + ",0"
$Shortcut.Description = "REAL intel - Commercial Land & Property Intelligence"
$Shortcut.Save()

# Invalidate Windows Explorer icon cache and force desktop redraw
try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinShell {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@ -ErrorAction SilentlyContinue
    [WinShell]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {}

Start-Process ie4uinit.exe -ArgumentList "-show" -Wait -ErrorAction SilentlyContinue

Write-Host "Created Desktop Shortcut at: $ShortcutPath"
Write-Host "Desktop icon refreshed successfully."
