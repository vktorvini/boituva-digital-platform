# Boituva Governança — README

## Objetivo deste pacote
Este pacote reúne a base documental inicial do projeto **Boituva Governança**, organizada para uso com:

- **Lovable** para criação e evolução do app
- **VS Code** para desenvolvimento e organização do projeto
- **Codex** para implementação guiada por specs e skills
- futura integração com **Supabase/Postgres**

O foco é construir uma **plataforma de governança municipal orientada por dados**, começando por finanças públicas e governança digital, com expansão futura por secretaria.

---

## Estrutura do pacote

```text
boituva_governanca_docs_final/
├── README.md
└── docs/
    ├── specs/
    └── skills/
```

### `docs/specs/`
Contém os documentos que definem:
- visão do produto
- arquitetura
- domínios
- regras
- UX
- integração
- backlog

Esses arquivos são a **fonte de verdade do projeto**.

### `docs/skills/`
Contém as skills que orientam o comportamento do agente/Codex na hora de:
- pensar produto
- preservar governança
- seguir a arquitetura
- manter a semântica do projeto
- construir a camada visual corretamente

Esses arquivos funcionam como **instruções operacionais permanentes**.

---

## Como usar este pacote no projeto

## 1. Copie a estrutura para o projeto
Leve a pasta `docs/` para a raiz do seu projeto.

Exemplo:

```text
meu-projeto/
├── docs/
│   ├── specs/
│   └── skills/
├── src/
├── app/
└── ...
```

---

## 2. Use os specs como base antes de codar
Sempre que for criar ou alterar algo importante, comece consultando os arquivos em:

```text
/docs/specs
```

### Ordem recomendada de leitura
1. `00_VISAO_PRODUTO.md`
2. `01_ARQUITETURA_GERAL.md`
3. `02_DOMINIO_FINANCEIRO.md`
4. `03_DOMINIO_GOVERNANCA_DIGITAL.md`
5. `10_BACKLOG_PRIORIZADO.md`

Depois, consulte os demais conforme o contexto.

---

## 3. Use as skills para guiar o Codex
No VS Code com Codex, use as skills como referência para orientar o comportamento do agente.

### Skills-base prioritárias
- `SKILL_PRODUCT_THINKING.md`
- `SKILL_URBAN_DATA_PLATFORM.md`
- `SKILL_GOVERNANCA_MUNICIPAL.md`
- `SKILL_PIPELINE_PUBLICO.md`
- `SKILL_DASHBOARD_EXECUTIVO.md`

### Skills complementares
- `SKILL_GOVERNANCA_DADOS.md`
- `SKILL_RBAC_MULTIPERFIL.md`
- `SKILL_ALERTAS_ANALITICOS.md`
- `SKILL_LGPD_SAFE_AGGREGATION.md`
- `SKILL_SUPABASE_ANALITICO.md`

---

## Fluxo recomendado de trabalho

## Etapa 1 — Produto
Defina claramente:
- problema
- usuário
- objetivo
- resultado esperado

Use:
- `00_VISAO_PRODUTO.md`
- `SKILL_PRODUCT_THINKING.md`

---

## Etapa 2 — Arquitetura
Confirme o fluxo:
- fonte
- bronze
- silver
- gold
- banco
- app

Use:
- `01_ARQUITETURA_GERAL.md`
- `SKILL_PIPELINE_PUBLICO.md`
- `SKILL_URBAN_DATA_PLATFORM.md`

---

## Etapa 3 — Domínio
Antes de criar telas ou consultas, valide a semântica do domínio.

Exemplo:
- financeiro → `02_DOMINIO_FINANCEIRO.md`
- governança digital → `03_DOMINIO_GOVERNANCA_DIGITAL.md`

---

## Etapa 4 — UX e narrativa
Antes de melhorar layout, valide se a interface:
- mostra situação
- mostra risco
- mostra tendência
- sugere acompanhamento

Use:
- `08_UX_E_NARRATIVA_EXECUTIVA.md`
- `SKILL_DASHBOARD_EXECUTIVO.md`
- `SKILL_GOVERNANCA_MUNICIPAL.md`

---

## Etapa 5 — Banco e integração
Quando sair dos mocks e for para dados reais:

Use:
- `09_INTEGRACAO_SUPABASE.md`
- `06_MODELO_DE_DADOS.md`
- `05_RBAC_E_PERFIS.md`
- `SKILL_SUPABASE_ANALITICO.md`
- `SKILL_RBAC_MULTIPERFIL.md`

---

## Como usar com o Lovable

O Lovable deve ser usado para:
- gerar rapidamente a interface
- estruturar páginas e componentes
- validar UX do app
- simular a experiência do produto

### Regra importante
O Lovable **não é a fonte de verdade**.

A fonte de verdade deve continuar sendo:
- specs
- skills
- arquitetura do projeto
- regras do domínio

### Fluxo ideal com Lovable
1. definir o que o produto precisa fazer nos specs
2. gerar ou ajustar o app no Lovable
3. revisar no VS Code
4. corrigir ou evoluir com Codex
5. manter os docs atualizados

---

## Como usar com VS Code + Codex

No VS Code, use este pacote para:
- orientar decisões
- reduzir retrabalho
- evitar inconsistência
- manter o projeto coerente

### Recomendação prática
Sempre que for pedir algo ao Codex:
1. diga qual spec está valendo
2. diga quais skills devem ser respeitadas
3. diga qual domínio está sendo alterado
4. diga se está em mock ou dados reais

### Exemplo de instrução
```text
Use como base:
- docs/specs/02_DOMINIO_FINANCEIRO.md
- docs/specs/08_UX_E_NARRATIVA_EXECUTIVA.md

Respeite:
- docs/skills/SKILL_GOVERNANCA_MUNICIPAL.md
- docs/skills/SKILL_DASHBOARD_EXECUTIVO.md

Objetivo:
refinar a Sala de Situação do domínio financeiro sem perder a leitura executiva.
```

---

## Ordem de execução recomendada

### Agora
1. consolidar docs
2. refinar app executivo no Lovable
3. estabilizar módulo financeiro
4. preparar integração com Supabase

### Em seguida
5. criar módulo de governança digital
6. subir dados reais
7. trocar mocks por consultas reais

### Depois
8. preparar RBAC
9. escolher próxima secretaria
10. escalar a plataforma

---

## O que evitar
- codar sem consultar specs
- adicionar feature sem dor clara
- misturar decisão de UX com regra de domínio
- criar dashboard bonito sem leitura executiva
- escalar por secretaria cedo demais
- usar dados sensíveis sem agregação adequada

---

## Regra central do projeto
Este projeto deve sempre seguir a hierarquia:

1. visão
2. arquitetura
3. domínio
4. regras
5. UX
6. código

Se inverter isso, o projeto cresce torto.

---

## Próximos passos sugeridos
- criar prompt operacional para o Codex baseado nestes docs
- refinar o app no Lovable com base no posicionamento executivo
- modelar integração real com Supabase
- preparar módulo de governança digital

---

## Resumo final
Este pacote não é só documentação.

Ele é a base para:
- pensar o produto corretamente
- organizar a engenharia
- orientar o Codex
- manter o Lovable sob controle
- escalar o projeto com coerência

A meta é simples:
**começar pequeno, provar valor e escalar com governança.**
