param(
    [switch]$SkipIbgeRefresh,
    [switch]$DryRun,
    [switch]$LegacyGold
)

$ErrorActionPreference = 'Stop'
$pipelineRoot = Split-Path -Parent $PSScriptRoot
Push-Location $pipelineRoot

try {
    if (-not (Test-Path '.env')) {
        throw 'Arquivo .env nao encontrado em pipeline/boituva-tce-pipeline. Configure DATABASE_URL antes de subir ao Supabase.'
    }

    $pythonExe = if (Test-Path '.venv\\Scripts\\python.exe') {
        '.venv\\Scripts\\python.exe'
    }
    elseif (Test-Path 'venv\\Scripts\\python.exe') {
        'venv\\Scripts\\python.exe'
    }
    else {
        'python'
    }

    Write-Host "[INFO] Python: $pythonExe"

    if (-not $SkipIbgeRefresh) {
        Write-Host '[STEP] Atualizando bronze do IBGE (Boituva)...'
        & $pythonExe -m src.main --dataset ibge_localidades --force
        if ($LASTEXITCODE -ne 0) {
            throw 'Falha ao atualizar localidades do IBGE.'
        }
    }

    if ($LegacyGold) {
        Write-Host '[STEP] Enviando tabelas legacy do gold TCE...'
        & $pythonExe -m src.main --dataset upload_cloud
        if ($LASTEXITCODE -ne 0) {
            throw 'Falha no upload legacy do gold TCE.'
        }
    }

    Write-Host '[STEP] Enviando modelo executivo para o Supabase...'
    $execArgs = @('-m', 'src.main', '--dataset', 'upload_exec_cloud')
    if ($DryRun) {
        $execArgs += '--dry-run'
    }
    & $pythonExe @execArgs
    if ($LASTEXITCODE -ne 0) {
        throw 'Falha no upload do modelo executivo.'
    }

    Write-Host '[OK] Processo finalizado.'
}
finally {
    Pop-Location
}
