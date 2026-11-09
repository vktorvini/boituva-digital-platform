# Backlog Inicial — Boituva Resolve

**Status:** Planejamento inicial. As tarefas de produção dependem dos portões institucionais e técnicos indicados.

## Fase 0 — Auditoria e decisões

- [ ] T001 Auditar a estrutura local completa do dashboard e convenções de componentes.
- [ ] T002 Confirmar se há autenticação Supabase Auth e RBAC em outros módulos.
- [ ] T003 Verificar dependência de mapa existente e avaliar opções compatíveis.
- [ ] T004 Auditar migrations, schemas, grants, RLS e Storage atuais.
- [ ] T005 Verificar disponibilidade de Supabase Edge Functions ou backend server-side.
- [ ] T006 Solicitar documentação da API 1Doc e ambiente de homologação.
- [ ] T007 Validar campos pessoais, base legal, aviso de privacidade e retenção com responsáveis municipais.
- [ ] T008 Definir ambiente de demonstração e separação entre dados fictícios e reais.

## Fase 1 — Fundação segura

- [ ] T009 Definir e revisar modelo físico de dados.
- [ ] T010 Criar migration versionada para tabelas Resolve.
- [ ] T011 Implementar RLS e grants mínimos.
- [ ] T012 Criar bucket privado e políticas de Storage.
- [ ] T013 Implementar endpoint server-side para submissão pública.
- [ ] T014 Implementar geração de protocolo e segredo de consulta.
- [ ] T015 Criar testes de autorização para anon, cidadão e perfis administrativos.

## Fase 2 — Registro público

- [ ] T016 Criar rota e formulário mobile-first.
- [ ] T017 Implementar captura GPS com fallback manual.
- [ ] T018 Implementar campo de endereço do local da ocorrência.
- [ ] T019 Implementar upload validado de fotografia.
- [ ] T020 Criar tela de confirmação com protocolo interno e instruções de consulta.
- [ ] T021 Implementar proteção anti-spam e rate limiting.

## Fase 3 — Painel administrativo

- [ ] T022 Implementar autenticação e RBAC.
- [ ] T023 Criar rota administrativa protegida.
- [ ] T024 Implementar mapa e lista privados.
- [ ] T025 Implementar detalhe com fotografia e localização.
- [ ] T026 Implementar validação/rejeição com justificativa.
- [ ] T027 Implementar histórico append-only.
- [ ] T028 Implementar sugestão de possíveis duplicidades.

## Fase 4 — Consulta e integração 1Doc

- [ ] T029 Implementar consulta individual por protocolo + segredo.
- [ ] T030 Criar contrato interno versionado de integração.
- [ ] T031 Implementar exportação operacional de contingência.
- [ ] T032 Implementar adaptador 1Doc após recebimento e validação da documentação.
- [ ] T033 Implementar outbox, idempotência, retry e auditoria.
- [ ] T034 Implementar sincronização de andamento se suportada oficialmente.

## Fase 5 — Testes e piloto

- [ ] T035 Testar fluxo completo com dados fictícios.
- [ ] T036 Testar isolamento de dados e URLs assinadas.
- [ ] T037 Testar dispositivos móveis e acessibilidade.
- [ ] T038 Testar falhas de rede, upload e integração.
- [ ] T039 Realizar homologação com equipe autorizada.
- [ ] T040 Liberar piloto real somente após autorização institucional e LGPD.
