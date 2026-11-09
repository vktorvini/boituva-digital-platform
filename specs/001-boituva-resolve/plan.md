# Plano de Implementação — Boituva Resolve

**Branch:** `001-boituva-resolve`  
**Status:** Proposta técnica inicial  
**Especificação:** [spec.md](./spec.md)

## 1. Resumo técnico

Implementar o Boituva Resolve como módulo da aplicação existente em `apps/dashboard`, com rotas públicas para registro/consulta e rotas privadas para administração. Reutilizar Supabase e a infraestrutura existente, sem criar projeto Supabase ou backend paralelo antes de demonstrar necessidade.

O repositório usa Vite + React + TypeScript, React Router, TanStack Query e `@supabase/supabase-js`. O cliente Supabase atual usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A aplicação atual não demonstra, nos arquivos de entrada consultados, um fluxo de autenticação administrativa já conectado.

## 2. Evidências da auditoria inicial

Arquivos consultados na branch `main`:
- `apps/dashboard/package.json`: Vite, React 18, TypeScript, React Router, TanStack Query, Supabase JS.
- `apps/dashboard/src/App.tsx`: rotas centralizadas em React Router.
- `apps/dashboard/src/lib/supabase.ts`: cliente Supabase com URL e anon key públicas.
- `supabase/migrations/001_public_views.sql`: views públicas de consumo analítico.
- `supabase/migrations/002_rls_security.sql`: RLS para schemas analytics e metadata; não contém ainda o domínio Resolve.
- `.specify/memory/constitution.md`: exige specs e governança antes de mudanças relevantes.

Não foi confirmado nesta auditoria:
- biblioteca de mapas já instalada;
- autenticação administrativa implementada e protegida por rotas;
- estrutura de funções server-side ou Supabase Edge Functions;
- políticas de Storage adequadas ao Resolve;
- estrutura de migrations específica para o módulo.

Esses pontos devem ser verificados no repositório local antes da implementação.

## 3. Arquitetura lógica proposta

```text
Cidadão (mobile/web)
       |
       v
Rotas públicas do dashboard
  /resolve
  /resolve/consultar
       |
       v
Endpoint server-side seguro
(Supabase Edge Function ou função backend validada)
       |
       +----> PostgreSQL / tabelas privadas
       |
       +----> Storage privado (fotografias)
       |
       v
Fila/outbox de integração
       |
       v
Adaptador 1Doc (quando documentado e autorizado)

Equipe municipal
       |
       v
Rotas administrativas protegidas
  /admin/resolve
       |
       +----> Mapa e lista
       +----> Detalhe/fotografia
       +----> Validação e histórico
       +----> Encaminhamento / sincronização
```

## 4. Decisões arquiteturais

### Frontend
- Manter o app Vite/React existente.
- Adicionar módulo isolado, por exemplo `src/features/resolve/`, seguindo convenções reais encontradas no repositório.
- Adicionar rotas sem alterar rotas financeiras existentes.
- Reutilizar design system e componentes atuais.
- Confirmar biblioteca de mapas antes de adicionar dependência. Não assumir Leaflet já instalado.

### Backend e banco
- Reutilizar Supabase PostgreSQL.
- Criar migrations versionadas em `supabase/migrations`.
- Manter dados do Resolve em tabelas próprias, sem misturar com schemas analíticos `analytics` e `metadata`.
- Não permitir inserção irrestrita de registros sensíveis diretamente pelo cliente anon.
- Implementar submissão por endpoint server-side confiável (Supabase Edge Function ou backend server-side escolhido após auditoria).
- Nunca colocar `service_role`, token 1Doc ou credenciais privadas no bundle Vite.

### Fotografias
- Bucket privado dedicado.
- Validar MIME real, extensão, tamanho e limites de dimensões.
- Usar nomes de objeto aleatórios, sem CPF, nome ou protocolo previsível.
- Servir imagens ao painel por autorização e URL assinada de curta duração.
- Definir política de retenção e descarte com a Prefeitura.

### Autenticação e autorização
- Reutilizar Supabase Auth se adequado.
- Verificar se já existe estrutura de perfis/RBAC.
- Separar papéis de administrador, gestor e operador.
- Não confiar em metadados editáveis pelo usuário para conceder privilégios.
- Proteger rotas no frontend e, principalmente, todas as operações no banco/servidor.

### Consulta cidadã
- Protocolo interno não deve ser segredo.
- Gerar token de consulta aleatório de alta entropia e armazenar somente hash.
- Exigir protocolo + token, ou solução equivalente aprovada.
- Aplicar rate limit, respostas que evitem enumeração e expiração/revogação quando aplicável.
- Retornar apenas status e dados mínimos; nunca PII ou imagem original.

## 5. Integração 1Doc

Criar uma abstração `OneDocAdapter` sem assumir endpoints. Fluxo:
1. Registro criado como `received`.
2. Operador valida e move para `ready_for_1doc`.
3. Evento/outbox é criado na mesma transação.
4. Worker/função server-side tenta envio, quando integração estiver habilitada.
5. Resposta confirmada grava protocolo externo e metadados mínimos.
6. Falhas são registradas e reprocessadas com idempotência.
7. Atualizações oficiais são consultadas por API/webhook, se a 1Doc disponibilizar.

Até a confirmação da API, usar fluxo manual controlado com resumo e anexos exportáveis. JSON gerado pelo Resolve é um contrato interno de intercâmbio, não um formato de importação garantido pelo 1Doc.

## 6. Sequência de implementação

### Fase 0 — Preparação e governança
- Auditar árvore real, autenticação, mapas, migrations, Storage e deploy.
- Confirmar responsáveis institucionais e ambiente de demonstração.
- Validar campos pessoais e finalidade com jurídico/encarregado.
- Solicitar documentação 1Doc e acesso a homologação.

### Fase 1 — Fundação segura
- Modelo de dados e migrations.
- RLS e grants mínimos.
- Bucket privado e políticas.
- Endpoint seguro de submissão.
- Testes de isolamento entre anon, authenticated e perfis administrativos.

### Fase 2 — Registro público
- Formulário mobile-first.
- GPS com fallback manual.
- Endereço digitado.
- Foto obrigatória.
- Protocolo e segredo de consulta.
- Tela de confirmação.

### Fase 3 — Painel administrativo
- Login e RBAC.
- Mapa e lista privados.
- Filtros e detalhe da ocorrência.
- Validação/rejeição com justificativa.
- Histórico de auditoria.

### Fase 4 — Consulta e 1Doc
- Consulta individual segura.
- Exportação operacional manual.
- Adaptador 1Doc após documentação e homologação.
- Sincronização de status quando suportada.

### Fase 5 — Qualidade e piloto
- Testes funcionais, segurança e acessibilidade.
- Dados fictícios claramente identificados.
- Homologação com equipe autorizada.
- Só habilitar dados reais após autorização institucional e validação LGPD.

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| API 1Doc indisponível ou limitada | Adaptador desacoplado e contingência manual |
| Exposição de CPF/RG/fotos | Separação de tabelas, RLS, bucket privado, URLs assinadas |
| Spam e protocolos falsos | Rate limit, CAPTCHA adaptativo, validação humana |
| Protocolo enumerável | Token aleatório separado e rate limit |
| Duplicidade de protocolo 1Doc | Idempotência e outbox |
| Confusão entre protocolo interno e oficial | Rótulos e estados separados |
| Escopo institucional não autorizado | Ambiente demonstrativo e bloqueio de produção |

## 8. Portões de aprovação

Não avançar para:
- migração em banco de produção sem revisão e autorização;
- coleta de dados reais sem decisão LGPD/institucional;
- integração 1Doc sem documentação, credenciais e homologação;
- deploy público do formulário real sem avaliação de segurança.

