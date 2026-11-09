# Integração com 1Doc — Boituva Resolve

**Status:** Descoberta técnica pendente; nenhum endpoint ou formato de importação foi confirmado.

## 1. Papel de cada sistema

- **Boituva Resolve:** interface simplificada de registro, validação inicial, geolocalização, fotografia, protocolo interno e consulta.
- **1Doc:** sistema oficial da Prefeitura para protocolo, tramitação, pareceres e acompanhamento institucional.

O Resolve não deve criar uma tramitação oficial paralela nem apresentar seu identificador interno como protocolo 1Doc.

## 2. Fluxo desejado

1. Cidadão envia registro ao Resolve.
2. Resolve gera protocolo interno e recibo de consulta.
3. Operador revisa localização, relato e foto.
4. Operador valida a ocorrência.
5. Resolve envia os dados ao 1Doc por integração autorizada.
6. 1Doc retorna número oficial e, se disponível, código de rastreamento.
7. Resolve vincula o protocolo oficial ao interno.
8. Resolve consulta atualizações por webhook ou API de leitura, se disponibilizados.
9. Cidadão consulta andamento no Resolve, com indicação clara da origem de cada atualização.

## 3. Capacidades a confirmar com a 1Doc

Solicitar documentação técnica e resposta formal sobre:

- API REST/JSON ou Web Services disponíveis para o contrato da Prefeitura.
- Criação de protocolo/documento por sistema externo.
- Inclusão de campos personalizados e metadados.
- Upload/anexação de uma ou mais fotografias.
- Seleção de assunto, tipo documental, unidade e setor de destino.
- Regras de autenticação, escopos, IP allowlist e rotação de credenciais.
- Retorno de número de protocolo e código de acompanhamento.
- Consulta de protocolo e histórico de movimentações.
- Webhooks/eventos de alteração de status.
- Idempotência, limites de requisição, retentativas e códigos de erro.
- Ambiente de homologação, documentação OpenAPI/Postman e suporte.
- Custos ou habilitações contratuais adicionais.
- Regras de guarda, sigilo e classificação documental.

## 4. Contrato interno preliminar de envio

O JSON abaixo é um **modelo interno proposto para discussão**, não é payload oficial da 1Doc e não deve ser enviado a nenhum endpoint até recebermos o contrato técnico do fornecedor.

```json
{
  "schema_version": "1.0",
  "source_system": "boituva_resolve",
  "resolve_protocol": "BR-EXEMPLO-2026-000001",
  "occurrence": {
    "type": "pothole",
    "description": "Buraco próximo ao cruzamento informado.",
    "address": "Rua de exemplo, Boituva/SP",
    "latitude": -23.000000,
    "longitude": -47.000000,
    "reported_at": "2026-11-09T12:00:00-03:00"
  },
  "citizen": {
    "full_name": "DADO OMITIDO NO EXEMPLO",
    "identification_reference": "RESTRITO"
  },
  "attachments": [
    {
      "file_reference": "private-storage-object-reference",
      "file_name": "foto-ocorrencia.jpg",
      "content_type": "image/jpeg"
    }
  ],
  "routing": {
    "subject": "Buraco em via pública",
    "destination_unit": "A DEFINIR COM A PREFEITURA"
  }
}
```

Não colocar CPF/RG em payload até confirmar necessidade, base legal, classificação do documento e exigência do 1Doc. O envio deve ocorrer server-side, com credenciais protegidas e logs sem dados pessoais.

## 5. Arquitetura do adaptador

Criar interface de domínio independente do fornecedor, por exemplo:
- `submitOccurrence(occurrenceId)`
- `getProtocol(externalProtocolId)`
- `getUpdates(externalProtocolId)`

Os nomes são conceituais; não representam endpoints reais.

O adaptador deve:
- transformar modelo interno no contrato oficial confirmado;
- usar idempotency key se suportada;
- registrar correlation ID e resultado;
- mascarar dados pessoais em logs;
- armazenar número oficial e status de integração;
- implementar timeout, retry com backoff e fila/outbox;
- impedir reenvio duplicado;
- permitir reprocessamento manual autorizado;
- separar falha transitória de erro definitivo.

## 6. Contingência antes da API

Enquanto a integração não estiver homologada:
- operador valida ocorrência;
- sistema gera resumo PDF/HTML e pacote de anexos para uso interno;
- operador abre o protocolo oficial no 1Doc;
- operador informa o número oficial no Resolve;
- Resolve mantém vínculo entre os dois protocolos.

A geração de JSON pode auxiliar intercâmbio técnico, mas não deve ser confundida com importação direta pelo 1Doc sem confirmação do fornecedor.

## 7. Critérios de homologação

- Enviar um registro de teste sem dados reais.
- Confirmar protocolo criado e unidade de destino.
- Confirmar anexo fotográfico.
- Confirmar consulta de andamento.
- Testar falha, timeout e retentativa.
- Provar que repetição do mesmo evento não cria novo protocolo.
- Verificar logs, proteção de segredos e minimização de dados.
- Obter aprovação formal do responsável municipal antes de produção.
