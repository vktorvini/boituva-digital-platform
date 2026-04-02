# Boituva Digital Platform

Plataforma orientada por dados para apoiar a gestão pública municipal de Boituva, unificando **engenharia de dados**, **visualização executiva** e **documentação de arquitetura** em um único ambiente de trabalho.

A proposta é simples:

> **começar pequeno, pensar grande e estruturar Boituva como uma cidade orientada por dados.**

---

## Visão do Projeto

O **Boituva Digital Platform** foi concebido para transformar dados públicos e administrativos em informação confiável para:

- acompanhamento da execução orçamentária e financeira
- geração de indicadores executivos
- suporte à tomada de decisão
- aumento de rastreabilidade e governança
- preparação de base para análises preditivas futuras

A plataforma é dividida em duas frentes principais:

1. **Dashboard / aplicação visual**
2. **Pipeline de dados do TCE**

---

## Estrutura do Projeto

```text
boituva-digital-platform/
├─ README.md
├─ .gitignore
├─ docs/
│  ├─ arquitetura/
│  ├─ negocio/
│  └─ projeto/
├─ apps/
│  └─ dashboard/
│     ├─ package.json
│     ├─ src/
│     ├─ public/
│     └─ ...
├─ data-platform/
│  └─ pipeline/
│     ├─ requirements.txt
│     ├─ data/
│     │  ├─ raw/
│     │  ├─ bronze/
│     │  ├─ silver/
│     │  └─ gold/
│     ├─ logs/
│     ├─ src/
│     ├─ scripts/
│     └─ docs/
└─ .env.example