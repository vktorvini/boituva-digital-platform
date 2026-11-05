$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Iniciando pipeline automatico (ciclo a cada 5h)..."
python scripts/auto_pipeline_every_5h.py --interval-hours 5
