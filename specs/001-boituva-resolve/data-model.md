# Modelo de Dados — Boituva Resolve

**Status:** Modelo lógico preliminar; não executar como migration sem revisão.

## 1. Princípios

- Separar identidade do cidadão dos dados operacionais da ocorrência.
- Nenhuma tabela com dados pessoais deve ter leitura anônima.
- Fotografias ficam em bucket privado; no banco guardar apenas caminho/metadata necessária.
- Protocolo Resolve e protocolo 1Doc são identificadores distintos.
- O histórico é append-only sempre que possível.
- Não armazenar CPF/RG até aprovação de necessidade, finalidade e base legal.
- Usar UUIDs internos e identificadores públicos não sequenciais.

## 2. Entidades propostas

### `resolve_citizens` — identidade privada
Campos lógicos:
- `id` UUID PK
- `full_name` texto obrigatório
- `cpf_encrypted` opcional e pendente de decisão
- `rg_encrypted` opcional e pendente de decisão
- `created_at`, `updated_at`
- metadados mínimos de origem/consentimento ou aviso de privacidade, conforme orientação jurídica

CPF/RG, caso aprovados, exigem estratégia real de criptografia/gestão de chaves no backend. Não usar hash simples como substituto de criptografia para dados que precisem ser recuperados. Não incluir esses campos em views, logs, analytics ou exports comuns.

### `resolve_occurrences` — ocorrência
- `id` UUID PK
- `protocol` identificador público aleatório/único
- `citizen_id` FK para identidade privada
- `category` inicialmente fixa como `pothole`
- `description` relato
- `location_address` endereço do buraco
- `latitude`, `longitude` numéricos, nullable quando GPS indisponível
- `location_source`: `gps`, `typed_address`, `gps_and_address`
- `neighborhood` opcional, preenchido apenas por geocodificação confiável ou revisão
- `status` estado interno
- `photo_object_path` caminho privado do Storage
- `onedoc_protocol` nullable
- `onedoc_tracking_code` nullable e protegido
- `submitted_to_onedoc_at` nullable
- `created_at`, `updated_at`

Não assumir endereço residencial do cidadão: o endereço é o local do buraco.

### `resolve_occurrence_updates` — histórico
- `id` UUID PK
- `occurrence_id` FK
- `from_status`, `to_status`
- `note` justificativa/observação
- `actor_user_id` nullable para eventos de sistema
- `source`: `resolve_admin`, `system`, `onedoc`
- `external_event_id` nullable
- `created_at`

Histórico deve registrar autor e origem. Eventos recebidos do 1Doc não devem ser apresentados como alterações manuais do Resolve.

### `resolve_admin_profiles` — autorização
- `user_id` UUID FK para Supabase Auth
- `role`: `admin`, `manager`, `operator`
- `active`
- `created_at`, `updated_at`

Atribuição de papel deve ser restrita a administradores confiáveis. Não permitir autoelevação.

### `resolve_lookup_secrets` — consulta privada
- `occurrence_id` FK
- `secret_hash`
- `created_at`
- `revoked_at` nullable
- `expires_at` nullable

Segredo bruto deve ser mostrado uma única vez ao cidadão ou entregue por canal seguro ainda a definir. Guardar apenas hash; nunca registrar o segredo em logs.

### `resolve_integration_outbox` — integração 1Doc
- `id` UUID PK
- `occurrence_id` FK
- `provider` inicialmente `onedoc`
- `event_type`
- `idempotency_key` único
- `payload_version`
- `status`: `pending`, `processing`, `succeeded`, `failed`
- `attempt_count`
- `last_error_code` sanitizado
- `created_at`, `processed_at`

Evitar armazenar payloads com PII em texto aberto. Se o fornecedor exigir payload completo, construir no backend no momento do envio, com acesso restrito e política de retenção.

## 3. Relacionamentos

```text
resolve_citizens 1 ---- N resolve_occurrences
resolve_occurrences 1 ---- N resolve_occurrence_updates
resolve_occurrences 1 ---- 1/N resolve_lookup_secrets
resolve_occurrences 1 ---- N resolve_integration_outbox
auth.users 1 ---- 0/1 resolve_admin_profiles
```

## 4. Índices e integridade

- UNIQUE em `protocol`.
- UNIQUE em `idempotency_key`.
- Índices em `status`, `created_at`, `neighborhood`.
- Índice espacial recomendado via PostGIS se já habilitado e aprovado; caso contrário, índice em latitude/longitude e estratégia de proximidade revisada.
- CHECK para latitude entre -90 e 90 e longitude entre -180 e 180.
- CHECK para estados e origem de localização.
- Foreign keys com comportamento de exclusão restritivo para preservar trilha de auditoria.

## 5. Acesso e RLS — intenção

| Perfil | Identidade | Ocorrências | Fotos | Histórico |
|---|---|---|---|---|
| anon | sem acesso | sem SELECT direto; submissão via endpoint | sem acesso direto | sem acesso |
| cidadão com segredo | somente dados mínimos da própria ocorrência via função segura | consulta individual limitada | sem foto original por padrão | andamento sanitizado |
| operador | dados necessários à triagem | leitura/atualização conforme função | URL assinada | leitura e criação |
| gestor | dados conforme necessidade funcional | leitura/gestão | URL assinada | leitura |
| administrador | administração controlada | administração | URL assinada | auditoria |

RLS não substitui validação server-side. Não conceder `SELECT` geral a `anon` ou `authenticated` nas tabelas privadas.

## 6. Storage

Bucket proposto: `resolve-private`.

- Privado, sem acesso público.
- Caminhos aleatórios por ocorrência.
- Limites de tamanho e MIME definidos em configuração.
- Validar assinatura/conteúdo do arquivo no servidor.
- URLs assinadas de curta duração.
- Remover EXIF/GPS embutido quando apropriado, preservando coordenadas do local em campos próprios.
- Política de retenção e descarte pendente de decisão institucional.

