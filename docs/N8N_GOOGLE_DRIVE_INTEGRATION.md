# Integração n8n + Google Drive

Esta integração permite que o n8n envie vídeos do Google Drive para catalogação no ZenCatalog usando `multipart/form-data`, sem enviar o vídeo em Base64 no JSON.

## Variáveis de ambiente

```env
N8N_INTEGRATION_API_KEY=uma-chave-longa-e-secreta
N8N_CATALOG_USER_EMAIL=usuario@exemplo.com
```

`N8N_CATALOG_USER_EMAIL` deve apontar para um usuário já existente no banco. O endpoint nunca aceita `userId` enviado pelo n8n.

## Autenticação

Todos os endpoints usam o mesmo header:

```http
Authorization: Bearer <N8N_INTEGRATION_API_KEY>
```

## Processar vídeo

```http
POST /api/integrations/n8n/videos/process
Content-Type: multipart/form-data
Authorization: Bearer <N8N_INTEGRATION_API_KEY>
```

Campos do form-data:

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `file` | Sim | Arquivo binário do vídeo. |
| `driveFileId` | Sim | ID original do arquivo no Google Drive. |
| `originalName` | Sim | Nome atual do arquivo no Google Drive. |
| `mimeType` | Sim | MIME type do vídeo. |
| `duration` | Não | Duração conhecida do vídeo. |
| `description` | Não | Observação adicional para o prompt. |
| `isWatchEveryDay` | Não | Booleano. Padrão: `false`. |
| `priorityValue` | Não | Inteiro. Padrão: `1`. |

MIME types permitidos inicialmente:

```text
video/mp4
video/webm
video/quicktime
video/x-matroska
```

Limite inicial de arquivo: `50 MB`.

### Exemplo de sucesso

```json
{
  "success": true,
  "alreadyProcessed": false,
  "catalogId": "id-do-catalogo",
  "driveFileId": "id-do-google-drive",
  "originalName": "nome-original.mp4",
  "suggestedFileName": "[ESP] Evangelho - Assunto - Autor.mp4",
  "catalog": {
    "category": "[ESP]",
    "subcategory": "Evangelho",
    "subject": "Assunto identificado",
    "author": "Autor identificado",
    "summary": "Resumo produzido",
    "mimeType": "video/mp4"
  }
}
```

### Arquivo já processado

Quando já existir um catálogo com o mesmo `userId` e `driveFileId`, o vídeo não é reenviado ao Gemini.

```json
{
  "success": true,
  "alreadyProcessed": true,
  "catalogId": "id-do-catalogo",
  "driveFileId": "id-do-google-drive",
  "originalName": "nome-original.mp4",
  "suggestedFileName": "[ESP] Evangelho - Assunto - Autor.mp4",
  "catalog": {
    "category": "[ESP]",
    "subcategory": "Evangelho",
    "subject": "Assunto identificado",
    "author": "Autor identificado",
    "summary": "Resumo produzido",
    "mimeType": "video/mp4"
  }
}
```

## Confirmar rename no Google Drive

Depois que o Google Drive confirmar que o arquivo foi renomeado, chame:

```http
PATCH /api/integrations/n8n/videos/{catalogId}/confirm
Content-Type: application/json
Authorization: Bearer <N8N_INTEGRATION_API_KEY>
```

Body:

```json
{
  "driveFileId": "id-do-drive",
  "finalName": "nome-final-aplicado.mp4"
}
```

Resposta:

```json
{
  "success": true,
  "catalogId": "id-do-catalogo",
  "driveFileId": "id-do-drive",
  "finalName": "nome-final-aplicado.mp4",
  "processingStatus": "COMPLETED",
  "processedAt": "2026-08-05T15:00:00.000Z"
}
```

## Códigos de erro

As falhas retornam sempre JSON.

```json
{
  "success": false,
  "code": "GEMINI_QUOTA_EXCEEDED",
  "error": "A cota do Gemini foi excedida.",
  "retryable": true
}
```

Principais códigos:

| HTTP | `code` | Quando ocorre |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | Campo `file` ausente. |
| 400 | `DRIVE_FILE_ID_REQUIRED` | Campo `driveFileId` ausente. |
| 400 | `INVALID_MIME_TYPE` | MIME type não permitido. |
| 400 | `FINAL_NAME_REQUIRED` | `finalName` ausente na confirmação. |
| 400 | `DRIVE_FILE_ID_MISMATCH` | `driveFileId` não corresponde ao catálogo. |
| 401 | `INVALID_N8N_API_KEY` | Header `Authorization` ausente ou inválido. |
| 404 | `N8N_CATALOG_USER_NOT_FOUND` | Usuário configurado não existe. |
| 404 | `CATALOG_NOT_FOUND` | Catálogo não pertence ao usuário configurado. |
| 409 | `CATALOG_PROCESSING` | O mesmo vídeo já está em processamento. |
| 413 | `FILE_TOO_LARGE` | Arquivo acima de 50 MB. |
| 429 | `GEMINI_QUOTA_EXCEEDED` | Cota do Gemini excedida. |
| 503 | `GEMINI_UNAVAILABLE` | Gemini indisponível. |
| 500 | `INTERNAL_ERROR` | Erro inesperado. |

## Configuração do HTTP Request no n8n

Method:

```text
POST
```

URL:

```text
https://zencatalog.gouveia.app.br/api/integrations/n8n/videos/process
```

Header:

```text
Authorization: Bearer <N8N_INTEGRATION_API_KEY>
```

Body Content Type:

```text
Form-Data
```

Campos:

| Name | Parameter Type | Valor |
| --- | --- | --- |
| `file` | n8n Binary File | Input Data Field Name: `data` |
| `driveFileId` | Form Data | ID vindo do nó de busca/listagem do Google Drive |
| `originalName` | Form Data | Nome original vindo do Google Drive |
| `mimeType` | Form Data | MIME type vindo do download |
| `duration` | Form Data | Opcional |
| `description` | Form Data | Opcional |
| `isWatchEveryDay` | Form Data | Opcional |
| `priorityValue` | Form Data | Opcional |

## Configuração do Google Drive para renomear

Use o nó Google Drive depois do HTTP Request de processamento:

```text
Operation: Update
File ID: {{$json.driveFileId}}
Name: {{$json.suggestedFileName}}
```

Depois do update, chame o endpoint de confirmação:

```text
PATCH https://zencatalog.gouveia.app.br/api/integrations/n8n/videos/{{$json.catalogId}}/confirm
```

Body JSON:

```json
{
  "driveFileId": "={{$json.driveFileId}}",
  "finalName": "={{$json.suggestedFileName}}"
}
```

## Fluxo completo

1. Google Drive lista ou busca vídeos na pasta `Entrada`.
2. Google Drive baixa o arquivo e expõe o binário em `data`.
3. HTTP Request envia `multipart/form-data` para `/process`.
4. ZenCatalog autentica a chave, resolve o usuário por `N8N_CATALOG_USER_EMAIL` e verifica duplicidade por `driveFileId`.
5. ZenCatalog envia o vídeo ao Gemini por arquivo binário, usa o prompt personalizado do usuário, gera metadados, nome sugerido e embedding.
6. ZenCatalog grava o catálogo com `processingStatus: PROCESSING` e retorna `suggestedFileName`.
7. Google Drive renomeia o arquivo usando `suggestedFileName`.
8. HTTP Request chama `/confirm`.
9. ZenCatalog grava o nome efetivamente aplicado, marca `processingStatus: COMPLETED` e preenche `processedAt`.
