$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$requiredFiles = @(
    'index.html'
    'assets/css/styles.css'
    'assets/js/script.js'
    'data/packages.json'
    'data/payment-methods.json'
    'data/regions.json'
    'data/site-data.json'
)

$sourceFiles = @()
foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        Write-Host "Required file missing: $relativePath" -ForegroundColor Red
        exit 1
    }
    $sourceFiles += Get-Item -LiteralPath $fullPath
}

$pagesPath = Join-Path $projectRoot 'pages'
if (-not (Test-Path -LiteralPath $pagesPath -PathType Container)) {
    Write-Host 'Required pages/ directory is missing.' -ForegroundColor Red
    exit 1
}
$sourceFiles += Get-ChildItem -LiteralPath $pagesPath -File -Filter '*.html'

$required = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::Ordinal)
$pattern = 'assets/images/[^"''<>\x60\r\n)]+?\.(?:png|jpe?g|webp|avif|gif|svg)'
foreach ($source in $sourceFiles) {
    $text = Get-Content -LiteralPath $source.FullName -Raw -Encoding UTF8
    if ($source.Extension -eq '.json') {
        try {
            $null = $text | ConvertFrom-Json
        } catch {
            Write-Host "Invalid JSON: $($source.Name)" -ForegroundColor Red
            exit 1
        }
    }
    foreach ($match in [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        [void]$required.Add($match.Value)
    }
}

if ($required.Count -eq 0) {
    Write-Host 'No static assets/images references were detected.' -ForegroundColor Red
    exit 1
}

$actual = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::Ordinal)
$imagesPath = Join-Path $projectRoot 'assets/images'
if (Test-Path -LiteralPath $imagesPath -PathType Container) {
    foreach ($file in (Get-ChildItem -LiteralPath $imagesPath -Recurse -File)) {
        $relative = $file.FullName.Substring($projectRoot.Length).TrimStart([char[]]'\/').Replace('\', '/')
        [void]$actual.Add($relative)
    }
}

$missing = @($required | Where-Object { -not $actual.Contains($_) } | Sort-Object)
if ($missing.Count -gt 0) {
    Write-Host 'Missing image paths or capitalization mismatches:' -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  $_" }
    exit 1
}

Write-Host "Four configuration JSON files parse. All $($required.Count) static image paths match, including capitalization." -ForegroundColor Green
Write-Host 'File check only: verify layout, profile lookup, and demo checkout in your browser.'
exit 0
