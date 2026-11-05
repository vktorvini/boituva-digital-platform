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

## Spec Kit

O repositório foi inicializado com **GitHub Spec Kit** para estruturar o desenvolvimento orientado por especificação.

Arquivos principais:

- `.specify/memory/constitution.md`: constituição operacional do projeto
- `.agents/skills/`: skills instaladas para o fluxo do spec-kit
- `.specify/templates/`: templates-base de spec, plano, tarefas e checklist

Fluxo recomendado:

1. consultar este `README` e os documentos em `apps/dashboard/docs/README.md` e `pipeline/boituva-tce-pipeline/README.md`
2. definir ou revisar a direção com `$speckit-constitution` quando necessário
3. criar a especificação com `$speckit-specify`
4. detalhar a execução com `$speckit-plan`
5. quebrar em tarefas com `$speckit-tasks`
6. implementar somente depois que spec e plano estiverem coerentes com o domínio

Regra prática: para este projeto, o `spec-kit` deve sempre respeitar a hierarquia já definida nos documentos do repositório: visão, arquitetura, domínio, regras, UX e código.

---

## Estrutura do Projeto

```text
boituva-digital-platform/
+- README.md
+- .gitignore
+- docs/
¦  +- arquitetura/
¦  +- negocio/
¦  +- projeto/
+- apps/
¦  +- dashboard/
¦     +- package.json
¦     +- src/
¦     +- public/
¦     +- ...
+- data-platform/
¦  +- pipeline/
¦     +- requirements.txt
¦     +- data/
¦     ¦  +- raw/
¦     ¦  +- bronze/
¦     ¦  +- silver/
¦     ¦  +- gold/
¦     +- logs/
¦     +- src/
¦     +- scripts/
¦     +- docs/
+- .env.example
```
