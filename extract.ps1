Add-Type -AssemblyName System.IO.Compression.FileSystem

function Extract-Docx {
    param (
        [string]$docxPath,
        [string]$outputPath
    )
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
        $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
        if (-not $entry) {
            Write-Host "No word/document.xml found in $docxPath"
            $zip.Dispose()
            return
        }
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $xmlText = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $zip.Dispose()

        $xml = [xml]$xmlText
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

        $paragraphs = $xml.SelectNodes("//w:p", $ns)
        $lines = New-Object System.Collections.Generic.List[string]
        
        foreach ($p in $paragraphs) {
            $runs = $p.SelectNodes("w:r/w:t", $ns)
            if ($runs) {
                $pText = ""
                foreach ($run in $runs) {
                    $pText += $run.InnerText
                }
                $lines.Add($pText)
            } else {
                $lines.Add("")
            }
        }
        
        $fullText = $lines -join "`r`n"
        [System.IO.File]::WriteAllText($outputPath, $fullText, [System.Text.Encoding]::UTF8)
        Write-Host "Successfully extracted $docxPath to $outputPath"
    }
    catch {
        Write-Host "Error extracting $docxPath : $_"
    }
}

$baseDir = "c:\Dev\real-evolution-website\DATA\REAL EVOLUTION _ RESEARCH"

Get-ChildItem -Path $baseDir -Filter *.docx | ForEach-Object {
    $docxPath = $_.FullName
    $outputPath = $docxPath.Replace(".docx", ".txt")
    Extract-Docx -docxPath $docxPath -outputPath $outputPath
}
