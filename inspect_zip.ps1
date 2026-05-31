Add-Type -AssemblyName System.IO.Compression.FileSystem

function Inspect-Zip {
    param ([string]$docxPath)
    Write-Host "Inspecting $docxPath..."
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    $zip.Entries | ForEach-Object {
        if ($_.Length -gt 1000) {
            Write-Host "$($_.FullName) - Size: $($_.Length) bytes"
        }
    }
    $zip.Dispose()
    Write-Host "Done.`n"
}

Inspect-Zip -docxPath "C:\Dev\real-evolution-website\DATA\REAL EVOLUTION _ RESEARCH\The REAL Problem.docx"
Inspect-Zip -docxPath "C:\Dev\real-evolution-website\DATA\REAL EVOLUTION _ RESEARCH\REAL research.docx"
