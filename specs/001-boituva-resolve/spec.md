# Boituva Resolve — Especificação do MVP

**Feature branch:** `001-boituva-resolve`  
**Status:** Draft — requisitos institucionais e integração 1Doc pendentes  
**Produto:** Boituva Digital Platform  
**Domínio:** Atendimento urbano / zeladoria  
**Escopo inicial:** registro e acompanhamento de buracos em vias públicas de Boituva

## 1. Contexto e problema

O cidadão atualmente precisa utilizar o fluxo disponível no 1Doc para formalizar uma solicitação sobre buracos em vias públicas. A proposta do Boituva Resolve é oferecer uma experiência mobile-first, com geolocalização e fotografia, reduzir o preenchimento repetitivo e encaminhar registros validados ao 1Doc, que permanece como sistema oficial de tramitação.

O Boituva Resolve não substitui o 1Doc, não cria uma tramitação administrativa paralela e não promete reduzir o prazo institucional informado pelo usuário (45 dias), que deverá ser confirmado com a Prefeitura.

## 2. Objetivos

1. Permitir que o cidadão registre um buraco pelo celular com poucos passos.
2. Capturar localização por GPS e/ou endereço digitado.
3. Exigir fotografia da ocorrência no MVP.
4. Permitir validação humana antes do encaminhamento oficial.
5. Oferecer consulta individual e privada do andamento por protocolo.
6. Disponibilizar à gestão um painel privado com mapa, fotos, filtros, histórico e integração com 1Doc.
7. Manter o 1Doc como fonte oficial do protocolo e das movimentações administrativas, caso a integração seja autorizada e tecnicamente disponibilizada.

## 3. Fora de escopo no MVP

- Outras categorias além de buracos em vias públicas.
- Mapa público ou listagem pública de ocorrências.
- Aplicativo nativo Android/iOS.
- Substituição do 1Doc.
- Alteração automática de prazos ou regras administrativas.
- Integração automática antes de documentação, credenciais, homologação e autorização institucional.
- Decisão automática de procedência, prioridade ou execução de serviço.
- Publicação de fotografias ou dados pessoais.
- Promessa de atendimento ou resolução dentro de prazo específico.

## 4. Perfis e jornadas

### US-01 — Registrar ocorrência (P1)

Como cidadão, quero registrar um buraco pelo celular, informar meus dados, localizar o problema por GPS e/ou endereço e anexar uma foto, para encaminhar a solicitação sem repetir manualmente o preenchimento no 1Doc.

**Critérios de aceite**
1. O formulário funciona em dispositivos móveis e desktop.
2. O cidadão informa nome completo e relato da ocorrência.
3. O local pode ser obtido por GPS, endereço digitado ou combinação dos dois.
4. O sistema solicita fotografia e valida formato, tamanho e conteúdo permitido.
5. O sistema informa claramente que o registro será submetido à validação.
6. O sistema gera um identificador interno do Boituva Resolve.
7. A confirmação distingue protocolo interno de protocolo oficial 1Doc.
8. CPF e RG foram solicitados como campos, mas sua obrigatoriedade fica bloqueada até validação de necessidade, finalidade e base legal pela área jurídica/encarregado de dados.

### US-02 — Validar e encaminhar (P1)

Como operador autorizado, quero revisar os dados, localização e fotografia, corrigir informações operacionais permitidas e validar ou rejeitar o registro, para evitar que ocorrências incorretas sejam encaminhadas ao 1Doc.

**Critérios de aceite**
1. O painel exige autenticação.
2. O operador vê mapa, fotografia e detalhes necessários à análise.
3. Toda alteração relevante gera histórico com usuário e data/hora.
4. O operador pode validar, solicitar correção por fluxo futuro ou rejeitar com justificativa.
5. O envio ao 1Doc ocorre somente após validação humana e habilitação formal da integração.
6. Falhas de integração permanecem visíveis e podem ser reprocessadas sem duplicar protocolos.

### US-03 — Consultar andamento (P1)

Como cidadão, quero consultar individualmente minha solicitação, para acompanhar o andamento sem acessar um mapa público.

**Critérios de aceite**
1. A consulta exige protocolo Resolve e segredo de consulta aleatório, ou mecanismo equivalente de autenticação forte.
2. O protocolo isolado não é suficiente para acessar o registro.
3. A consulta não expõe CPF, RG, nome completo, foto original ou outros dados pessoais.
4. Quando houver protocolo 1Doc, ele é exibido como referência oficial.
5. O andamento exibido distingue eventos internos do Resolve de movimentações oficiais recebidas do 1Doc.

### US-04 — Gerir ocorrências (P2)

Como gestor, quero visualizar e filtrar ocorrências em mapa e lista, acompanhar indicadores e consultar o histórico, para organizar a análise e o encaminhamento.

**Critérios de aceite**
1. Mapa e lista são exclusivos da área administrativa.
2. Filtros incluem situação, período e bairro/localidade quando disponível.
3. O detalhe apresenta fotografia, endereço, coordenadas, relato, protocolos e histórico conforme permissão.
4. Acesso a dados pessoais é restrito a perfis autorizados e justificado pela função.
5. Indicadores não são apresentados como métricas oficiais de produtividade da Prefeitura sem validação institucional.

### US-05 — Sincronizar com 1Doc (P2, dependente de fornecedor)

Como sistema, quero enviar registros validados ao 1Doc e receber identificador e atualizações, para manter uma única tramitação oficial.

**Critérios de aceite**
1. A integração usa API/Web Service oficialmente documentado e autorizado.
2. O sistema registra requisição, resposta, identificador externo e falhas sem armazenar segredos em logs.
3. Reenvios são idempotentes ou protegidos contra duplicidade.
4. O sistema não presume endpoints, formatos JSON ou webhooks que não tenham sido confirmados pela 1Doc.
5. Enquanto a integração não estiver disponível, existe procedimento operacional de encaminhamento manual com pacote de dados e anexos.

## 5. Requisitos funcionais

- **FR-001:** O sistema deve oferecer formulário público mobile-first para ocorrência de buraco.
- **FR-002:** O sistema deve aceitar localização GPS e/ou endereço digitado.
- **FR-003:** O sistema deve capturar latitude/longitude quando houver GPS disponível e consentimento/permissão do navegador.
- **FR-004:** O sistema deve exigir fotografia no MVP e validar arquivo.
- **FR-005:** O sistema deve gerar protocolo interno único.
- **FR-006:** O sistema deve permitir consulta individual protegida.
- **FR-007:** O sistema deve possuir painel administrativo autenticado.
- **FR-008:** O painel deve exibir mapa, foto, lista, filtros e histórico.
- **FR-009:** O sistema deve registrar ator, data/hora e conteúdo das alterações de status.
- **FR-010:** O sistema deve distinguir status interno do Resolve e status oficial do 1Doc.
- **FR-011:** O sistema deve suportar integração futura com 1Doc por adaptador, sem acoplar o domínio ao fornecedor.
- **FR-012:** O sistema deve impedir acesso público a dados pessoais, fotografias privadas e registros administrativos.
- **FR-013:** O sistema deve detectar possíveis duplicidades por proximidade geográfica, categoria e janela temporal, apenas como sugestão para revisão humana.
- **FR-014:** O sistema deve manter trilha de auditoria e estado de falha/reprocessamento de integração.
- **FR-015:** O sistema deve oferecer exportação operacional controlada para contingência manual, sem afirmar que JSON é formato de importação oficial do 1Doc.

## 6. Requisitos não funcionais e governança

- Segurança por padrão, RLS e privilégio mínimo.
- Segredos de integração somente em ambiente server-side.
- Nenhuma chave Supabase `service_role` no bundle do navegador.
- Fotografias em armazenamento privado.
- Proteção contra enumeração de protocolos, spam, abuso e upload malicioso.
- Minimização de dados pessoais, finalidade explícita, controle de retenção e trilha de acesso.
- Acessibilidade e experiência mobile-first.
- Não misturar dados fictícios de demonstração com registros reais.
- Ambiente de demonstração separado de produção.
- Não ativar coleta real sem autorização institucional, avaliação LGPD e definição do fluxo oficial.

## 7. Dados solicitados e pendências LGPD

O formulário inicialmente proposto inclui nome completo, CPF, RG, endereço do local da ocorrência, relato e fotografia. O endereço aqui é o local do buraco, não necessariamente o endereço residencial do cidadão.

**Ponto de bloqueio:** CPF e RG não devem ser obrigatórios por padrão. A necessidade de cada campo, finalidade, base legal, prazo de retenção, transparência, acesso e compartilhamento com 1Doc devem ser validados pela Prefeitura/área jurídica/encarregado de dados antes de produção. Não coletar dados adicionais de contato sem decisão explícita sobre finalidade e necessidade.

## 8. Status de domínio

Status internos sugeridos:
- `received`: recebido no Resolve;
- `under_review`: em análise;
- `validated`: validado por operador;
- `rejected`: não procedente, com justificativa;
- `ready_for_1doc`: pronto para encaminhamento;
- `submitted_to_1doc`: enviado e confirmado pelo 1Doc;
- `integration_error`: falha no encaminhamento;
- `in_progress`: execução, somente se refletida por fonte oficial ou atualização autorizada;
- `resolved`: resolvido, somente conforme confirmação definida pela Prefeitura.

Os estados oficiais do 1Doc devem ser armazenados separadamente ou mapeados sem sobrescrever o histórico original.

## 9. Critérios de sucesso do MVP

- Um cidadão consegue concluir um registro de teste em até 3 minutos, desconsiderando permissões do dispositivo.
- 100% dos registros possuem protocolo interno, data/hora e histórico inicial.
- 100% dos arquivos enviados passam por validação de tipo e tamanho.
- Nenhum dado pessoal ou fotografia é acessível anonimamente.
- Operadores autorizados conseguem localizar um registro no mapa e revisar sua fotografia.
- Reenvio de integração não cria duplicidade.
- Consulta individual não permite acesso usando apenas um número de protocolo.
- Integração 1Doc somente é considerada concluída após homologação com a empresa e autorização institucional.

## 10. Decisões e questões em aberto

| Tema | Situação |
|---|---|
| Escopo inicial | Definido: buracos em vias públicas |
| Mapa público | Não haverá |
| Consulta cidadã | Individual e protegida |
| Localização | GPS e/ou endereço digitado |
| Foto | Obrigatória no MVP |
| Identificação | Nome completo solicitado; CPF/RG pendentes de validação LGPD |
| Painel | Privado, com autenticação e perfis |
| 1Doc | Sistema oficial de tramitação; integração a confirmar |
| API / JSON / anexos | Documentação e homologação pendentes |
| Canal de contato para retorno | Não definido |
| Prazo de retenção | Pendente de decisão institucional |
| Prazo de atendimento | Não definido pelo Resolve; referência de 45 dias precisa ser confirmada |
| Ambiente inicial | Demonstração controlada até autorização para dados reais |
