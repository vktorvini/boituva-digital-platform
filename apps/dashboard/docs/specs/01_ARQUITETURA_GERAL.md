# 01_ARQUITETURA_GERAL.md

## Fluxo macro
```text
Fontes públicas e administrativas
        ↓
Coleta / ingestão
        ↓
Raw / aterrissagem
        ↓
Bronze
        ↓
Silver
        ↓
Gold
        ↓
Supabase / Postgres
        ↓
API / data layer
        ↓
App executivo (Lovable)
```

## Banco online
Escolha recomendada: Supabase / Postgres.

## Princípios
- modularidade por domínio
- rastreabilidade entre camadas
- versionamento
- separação entre dado bruto e dado de decisão
- expansão controlada por secretaria
