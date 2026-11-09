# Segurança, Privacidade e LGPD — Boituva Resolve

**Status:** Controles propostos; avaliação jurídica/institucional obrigatória antes de dados reais.

## 1. Dados e finalidade

O MVP pretende tratar:
- nome completo do solicitante;
- CPF e RG, cuja necessidade ainda precisa ser demonstrada;
- endereço do local do buraco;
- relato;
- coordenadas GPS, quando fornecidas;
- fotografia;
- protocolo e histórico;
- dados de autenticação e auditoria de operadores.

O endereço informado é o local da ocorrência, não deve ser presumido como endereço residencial.

## 2. Minimização

Antes de produção, a Prefeitura deve documentar:
- finalidade específica de cada campo;
- base legal aplicável;
- necessidade e proporcionalidade;
- responsável/controlador e operadores;
- compartilhamento com 1Doc;
- prazo de retenção e descarte;
- direitos dos titulares e canal de atendimento;
- conteúdo do aviso de privacidade.

CPF e RG ficam como pendência de decisão. Não devem ser obrigatórios apenas por conveniência, nem usados como senha de consulta. Se a identificação for necessária, avaliar se nome e outro meio de validação menos intrusivo atendem ao objetivo.

## 3. Segurança técnica mínima

- RLS habilitado em todas as tabelas privadas.
- Negar acesso anônimo direto a identidade, ocorrência, histórico e storage.
- Inserção pública somente por função/endpoint server-side com validação.
- Não expor Supabase service role, credenciais 1Doc ou chaves privadas no frontend.
- Autenticação forte para operadores, com MFA quando disponível.
- RBAC validado no servidor/banco, não apenas na interface.
- Buckets privados e URLs assinadas de curta duração.
- Criptografia em trânsito e controles de criptografia em repouso conforme infraestrutura.
- Criptografia de campos sensíveis recuperáveis com chaves fora do banco, se sua coleta for aprovada.
- Logs sem CPF, RG, segredo de consulta, foto ou payload integral.
- Rate limiting, proteção anti-bot e limitação de tentativas.
- Validação de arquivos, tamanho, MIME real, extensão e conteúdo.
- Auditoria de acesso e alterações administrativas.
- Backups e plano de resposta a incidentes.

## 4. Consulta por protocolo

- Protocolo não é credencial.
- Gerar segredo aleatório de alta entropia.
- Mostrar o segredo uma vez e armazenar somente seu hash.
- Exigir protocolo + segredo.
- Limitar tentativas e aplicar atraso/rate limit.
- Respostas de erro não devem revelar se um protocolo existe.
- Não retornar identificação, foto original ou coordenadas precisas ao público.
- Definir fluxo de recuperação/revogação antes de produção.

## 5. Fotografias e geolocalização

- Informar ao cidadão por que a foto e localização são solicitadas.
- Solicitar permissão de GPS no momento necessário.
- Permitir endereço digitado quando GPS não estiver disponível.
- Não usar metadados EXIF como fonte autoritativa de localização.
- Considerar remoção de EXIF e alerta para evitar fotografar rostos, placas ou documentos.
- Não publicar fotos.
- Restringir visualização às funções administrativas necessárias.

## 6. Retenção e descarte

O prazo não está definido. Não implementar retenção arbitrária antes de validar:
- regras de gestão documental;
- temporalidade de processos administrativos;
- obrigações legais e arquivísticas;
- contrato e política do 1Doc;
- política municipal de proteção de dados.

## 7. Portão de produção

Não receber registros reais até que estejam aprovados:
1. finalidade e base legal;
2. campos obrigatórios;
3. aviso de privacidade;
4. prazo de retenção;
5. perfis e responsáveis;
6. controles de acesso e auditoria;
7. fluxo oficial de integração/contingência;
8. autorização institucional para piloto.
