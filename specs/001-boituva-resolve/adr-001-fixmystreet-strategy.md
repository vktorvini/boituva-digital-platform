# ADR-001 — Estratégia de reutilização do FixMyStreet

**Status:** Proposta — decisão pendente  
**Data:** 2026-11-09  
**Projeto:** Boituva Resolve

## Contexto

O Boituva Resolve deve oferecer registro mobile de buracos, validação por servidor municipal, painel privado com mapa/fotografias e geração de um pacote JSON para posterior protocolo no 1Doc.

O repositório Boituva Digital Platform já utiliza Vite, React, TypeScript, React Router e Supabase. O FixMyStreet é uma plataforma open source madura, mas usa Perl/Catalyst, PostgreSQL e uma arquitetura própria de instalação e operação.

O FixMyStreet é distribuído sob AGPL-3.0. Uma implantação modificada disponibilizada como serviço de rede deve observar as obrigações da AGPL, incluindo disponibilizar o código-fonte correspondente da versão modificada aos usuários que interagem remotamente, conforme a licença. Revisão jurídica é necessária antes de adoção institucional.

## Alternativas

### A — Fork real do FixMyStreet

- Criar repositório próprio derivado de `mysociety/fixmystreet`.
- Manter avisos de copyright e licença.
- Customizar idioma, identidade visual, categorias, fluxo e regras de privacidade.
- Executar a aplicação Perl/Catalyst em infraestrutura compatível, provavelmente separada do Vercel/Supabase atual.
- Implementar exportação JSON e integração futura com 1Doc.
- Revisar e cumprir AGPL-3.0, incluindo disponibilização do código-fonte correspondente da versão modificada aos usuários remotos.
- Avaliar o esforço para desabilitar mapa público, listagem pública, alertas e funcionalidades incompatíveis com o desenho privado do Resolve.

**Vantagem:** reaproveita código e fluxos existentes do FixMyStreet.  
**Desvantagem:** introduz stack, hospedagem, operação e manutenção independentes; customização para privacidade pode ser significativa.

### B — Implementação nativa no Boituva Digital

- Desenvolver módulo React/TypeScript no dashboard atual.
- Reutilizar Supabase, Storage, Auth e infraestrutura existentes.
- Reimplementar somente os fluxos necessários, usando FixMyStreet como referência funcional e de UX.
- Não copiar código-fonte do FixMyStreet; manter licenças das dependências próprias.
- Implementar pacote JSON versionado para encaminhamento manual ao 1Doc.

**Vantagem:** integração direta à plataforma atual e menor fragmentação operacional.  
**Desvantagem:** não reutiliza diretamente o código do FixMyStreet; funcionalidades precisam ser desenvolvidas e testadas.

### C — Serviço FixMyStreet separado com integração ao Boituva Digital

- Executar um fork AGPL separado como serviço de ocorrências.
- Integrar ao Boituva Digital por API autenticada ou links, mantendo dados e autenticação sincronizados apenas quando tecnicamente justificado.
- Criar adaptador/exportador JSON e futura integração 1Doc.
- Tratar explicitamente duplicidade de usuários, autorização, dados pessoais, fotos e sincronização.

**Vantagem:** preserva maior parte do FixMyStreet e permite integração com a plataforma existente.  
**Desvantagem:** maior complexidade arquitetural e de operação; sincronização entre sistemas é um risco adicional.

## Restrições de produto

Independentemente da alternativa:
- O escopo inicial é exclusivamente buracos em vias públicas.
- Não haverá mapa público nem listagem pública de registros.
- A consulta cidadã será individual e protegida.
- O painel com mapa, dados e fotografias será privado.
- Toda ocorrência passa por validação humana antes de ser exportada/encaminhada.
- O Resolve gera protocolo interno distinto do protocolo oficial 1Doc.
- O JSON é contrato de exportação interno versionado; não é formato de importação 1Doc confirmado.
- CPF/RG não serão campos obrigatórios até avaliação formal de necessidade e LGPD.
- Nenhum dado real deve ser coletado antes de autorização institucional e controles de segurança.

## Recomendação técnica preliminar

Se o requisito principal for **reutilizar efetivamente o código do FixMyStreet**, escolher A ou C, aceitando AGPL-3.0 e a operação de uma aplicação Perl/Catalyst. C só deve ser escolhida se houver uma necessidade concreta de integrar módulos do Boituva Digital no curto prazo.

Se o requisito principal for **entregar rapidamente um módulo integrado à plataforma atual**, escolher B, usando FixMyStreet como referência de produto e não como código-fonte.

Não iniciar implementação de backend ou banco até esta decisão ser confirmada, pois a escolha altera repositório, linguagem, infraestrutura, autenticação, armazenamento e modelo de dados.
