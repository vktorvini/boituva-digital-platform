# Reuso do Legado "Boituva Digital"

## Escopo analisado

- Pasta base: `C:\Users\Vktor\Desktop\Boituva Digital`
- Subpasta foco: `C:\Users\Vktor\Desktop\Boituva Digital\Projetos Anteriores`
- Tipos lidos: `.md`, `.py`, `.ipynb`
- Total filtrado (sem `venv/.venv`): 98 arquivos

## Principais achados

1. O legado tem boa base conceitual de governanca e camada semantica para uso por prefeito e secretarios.
2. O legado "Boituva_2" traz comparativo regional de `IEGM` e `i-Gov TI` pronto para Sorocaba e municipios pares.
3. Havia scripts com credenciais hardcoded em projeto anterior; isso nao foi reaproveitado por risco de seguranca.
4. O projeto atual ja tinha estrutura de fontes oficiais, mas o comparativo regional ainda estava majoritariamente em placeholder.

## Reaproveitamento aplicado no projeto atual

### 1) Pipeline regional IEGM/i-Gov TI

- Nova pipeline: `pipeline/boituva-tce-pipeline/src/pipelines/tcesp_iegm_igov_regional.py`
- Origem reaproveitada: notebook legado  
  `Projetos Anteriores/Boituva_2/analise_iegm_sorocaba.ipynb`
- Saidas:
  - `data/silver/tcesp/iegm_igov_regional/tcesp_iegm_igov_regional.csv`
  - `data/gold/tcesp/iegm_igov_regional/tcesp_iegm_igov_regional.parquet`
  - metadata de rastreabilidade no `gold`

### 2) Orquestracao

- `src/main.py` atualizado com dataset:
  - `tcesp_iegm_igov_regional`

### 3) Export para dashboard

- `scripts/export_dashboard_sources.py` atualizado para incluir secao:
  - `tcesp.json -> regional`
- Esta secao publica:
  - linhas por municipio
  - resumo de cobertura
  - eixos com Boituva x media regional x benchmark

### 4) Frontend com dado real

- `apps/dashboard/src/services/sourcePipelines.ts` tipado para `regional`
- `apps/dashboard/src/pages/TcespFonte.tsx` com leitura da base regional
- `apps/dashboard/src/pages/OperacionalIegmIgov.tsx` com matriz por eixo baseada no pipeline

## O que nao foi reaproveitado (proposital)

1. Scripts antigos com conexao local e senha em codigo.
2. Estruturas de projeto duplicadas que conflitam com o pipeline atual.
3. Artefatos de estudo isolados sem rastreabilidade de pipeline.

## Proximo passo recomendado

Substituir a base legada manual por ingestao oficial periodica de export TCESP/IEGM assim que o formato final de publicacao do tribunal estiver padronizado para automacao mensal.
