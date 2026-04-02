# 02_DOMINIO_FINANCEIRO.md

## Objetivo
Fornecer uma leitura confiável e executiva da situação financeira do município.

## Regras semânticas críticas
- não somar indiscriminadamente estágios da despesa
- comparação principal: receita_total vs despesa_paga
- comparação complementar: receita_total vs despesa_empenhada

## Indicadores principais
- execucao = despesa_paga / despesa_empenhada
- gap_empenhado_pago = despesa_empenhada - despesa_paga
- pressao_fiscal = gap_empenhado_pago / receita_total

## Tabelas
- gold_financeiro_mensal
- gold_financeiro_anual
- gold_receita_mensal_fonte
- gold_despesa_mensal_evento
- gold_indicadores_fiscais
