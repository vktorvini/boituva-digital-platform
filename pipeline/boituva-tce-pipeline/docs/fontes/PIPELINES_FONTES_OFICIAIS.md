# Pipelines de Fontes Oficiais

## Objetivo

Padronizar cinco novas fontes oficiais para alimentar o app executivo:

- `TSE`
- `IBGE SIDRA`
- `PNCP`
- `Siconfi / MSC`
- `TCESP export`

## Comandos

```bash
python -m src.main --dataset tse_open_data
python -m src.main --dataset ibge_sidra_demografia
python -m src.main --dataset pncp_contratacoes
python -m src.main --dataset siconfi_fiscal
python -m src.main --dataset tcesp_exports
```

## Convencao de camadas

- `raw`: resposta original da API ou arquivo baixado
- `bronze`: estrutura tabular sem regra de negocio pesada
- `silver`: tipagem e padronizacao minima
- `gold`: resumo pronto para alimentar o app e o Supabase

## O que ja esta implementado

### TSE
- busca no catalogo CKAN oficial
- inventario de pacotes e recursos
- opcionalmente baixa o primeiro recurso do pacote quando rodado com `--force`

### IBGE SIDRA
- consulta API oficial do SIDRA
- salva indicadores demograficos municipais de Boituva

### PNCP
- conector para `contratos`
- conector para `contratacoes/publicacao`
- persistencia de `raw`, `bronze`, `silver` e `gold`

### Siconfi / MSC
- consulta recurso `msc_orcamentaria`
- persiste resposta e resumo

### TCESP export
- downloader por manifesto versionado em `docs/fontes/tcesp_exports_manifest.json`
- pronto para incluir IEGM, i-Gov TI e outros exports oficiais

## Proxima fase

1. filtrar datasets TSE diretamente para Boituva
2. consolidar indicadores SIDRA adicionais de renda, moradia e escolaridade
3. fechar consultas Siconfi para RCL, pessoal, RREO e RGF
4. ampliar manifesto do TCESP com bases comparativas da regiao de Sorocaba
5. publicar fatos e dimensoes no modelo medalhao do app
