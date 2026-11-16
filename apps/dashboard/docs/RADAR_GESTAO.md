# Radar de Gestão — MVP financeiro

## Arquitetura

O Radar é uma nova página do dashboard (`/radar-gestao`), integrada ao roteamento,
menu lateral e layout existentes. O frontend consulta o Supabase com o cliente e
os hooks React Query já utilizados pelo projeto. A página consome
`public.vw_financeiro_mensal` e `public.vw_pipeline_status`; não consulta tabelas
internas diretamente nem carrega registros detalhados de despesas.

Não foi criada migration: o MVP usa as views existentes e não altera tabelas ou
pipelines.

## Fontes e cobertura auditada

Auditoria somente leitura realizada em 9 de novembro de 2026:

- `public.vw_financeiro_mensal`: 153 linhas mensais, de 2014 a 2026; 2026 contém
  janeiro a setembro. Não foram observados meses duplicados nem valores nulos nos
  campos de receita realizada e despesas empenhada, liquidada e paga.
- `public.vw_financeiro_anual`: 13 exercícios. As somas mensais das despesas
  pagas conciliam com o agregado anual em todos os exercícios consultados.
- `public.vw_receita_fonte`: 538 linhas publicadas de 2014 a 2026.
- `public.vw_dim_tempo`: 153 períodos.
- `public.vw_secretarias`: 7 secretarias cadastradas, mas isso não significa que
  existam despesas associadas a elas.
- `public.vw_pipeline_status`: sem registros; não há data de atualização
  verificável publicada para exibição.
- `analytics.fato_despesa_mensal_secretaria` e `analytics.vw_exec_secretarias`
  existem, porém ambos estão sem registros. Não foi encontrada relação de
  fornecedores no catálogo consultado.
- `analytics.gold_despesa_mensal_evento` possui eventos contábeis (como
  empenhado, liquidado e pago), não uma classificação confiável por natureza da
  despesa. Esse conjunto não é apresentado como categoria de gasto.
- O Silver local declara 592.815 registros detalhados com campos de órgão,
  fornecedor e empenho. Esses registros não estão disponíveis nas views usadas
  pelo frontend e não são carregados pelo navegador.

As tabelas GOLD locais e as relações GOLD do banco não têm sempre a mesma
cobertura. Para o dashboard, a view pública mensal é a referência de leitura,
pois inclui os dados publicados de 2026. Não se deve inferir atualização do
pipeline a partir dos metadados locais.

## Indicadores e fórmulas

- **Despesa empenhada, liquidada e paga**: soma do campo correspondente em
  `vw_financeiro_mensal`, sempre exibida em indicadores separados.
- **Receita realizada**: soma de `receita_realizada`; não é previsão
  orçamentária.
- **Despesa paga acumulada**: soma dos meses do exercício até o mês selecionado
  (ou de todos os meses publicados quando o filtro estiver em “todos”).
- **Variação da despesa paga**: `(valor atual / referência - 1) × 100`, usando
  os mesmos meses do exercício anterior. Quando não há referência positiva, a
  variação não é calculada.
- **Alertas de variação**: destacam estágios de despesa com variação absoluta
  igual ou superior a 20% contra o mesmo mês do exercício anterior. O alerta
  informa período, indicador, valor atual, referência e justificativa. É um
  sinal para análise gerencial, não afirma irregularidade.
- **Comparação entre exercícios**: soma dos campos financeiros para o filtro
  selecionado; ao escolher um mês, compara esse mesmo mês nos exercícios
  anteriores.

## Limitações visíveis na interface

Não são calculados despesa por órgão/secretaria, concentração ou quantidade de
fornecedores, número de empenhos/registros processados ou categorias de gasto.
As dimensões necessárias não estão preenchidas/publicadas no Supabase. A data
da última atualização também fica indisponível enquanto
`vw_pipeline_status` não receber registros. Valores orçamentários previstos não
são apresentados como realizados.

## Atualização dos dados

O Radar reflete os dados carregados pelo pipeline TCE-SP e publicados nas views
Supabase existentes. Após executar o pipeline e publicar novos dados, a consulta
é atualizada pelo React Query (cache configurado no hook financeiro). A tela só
mostrará data de atualização quando a view de status tiver uma execução
publicada.

## Desenvolvimento local

1. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente local do
   dashboard; não use `service_role` no frontend.
2. Na pasta `apps/dashboard`, instale as dependências do projeto, se necessário.
3. Execute `npm run dev`.
4. Acesse `/radar-gestao` e use os filtros globais de exercício e mês.
5. Use **Imprimir / salvar PDF** para gerar uma versão imprimível.

Validação direcionada: `npm test -- src/test/radarFinanceiro.test.ts`,
`npm run lint` e `npm run build`.
