# Integração com PagSeguro - Títulos Financeiros

Este documento explica como configurar e usar a integração com o PagSeguro para geração de PIX nos títulos financeiros.

## Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
PAGSEGURO_TOKEN="seu-token-aqui"
PAGSEGURO_EMAIL="seu-email@pagseguro.com"
NODE_ENV="development" # ou "production"
```

### 2. Obter Token do PagSeguro

1. Acesse sua conta no [PagSeguro](https://pagseguro.uol.com.br/)
2. Vá em **Integrações** > **Token de Segurança**
3. Gere um novo token ou use um existente
4. Copie o token e adicione na variável `PAGSEGURO_TOKEN`

### 3. Ambientes

- **Sandbox (Desenvolvimento)**: `NODE_ENV=development`
  - URL: `https://sandbox.api.pagseguro.com`
  - Use dados fictícios para testes
  
- **Produção**: `NODE_ENV=production`
  - URL: `https://api.pagseguro.com`
  - Use dados reais

## Como Funciona

### 1. Criação de Título Financeiro

```javascript
POST /admin/users/:userId/financial-titles
{
  "description": "Mensalidade Janeiro 2024",
  "amount": 99.90,
  "dueDate": "2024-01-31"
}
```

### 2. Geração de PIX

```javascript
POST /admin/financial-titles/:titleId/generate-pix
```

Retorna:
```javascript
{
  "message": "PIX gerado com sucesso",
  "pixCode": "00020126580014BR.GOV.BCB.PIX...",
  "qrCode": "https://sandbox.api.pagseguro.com/qrcode/...",
  "title": { /* dados do título atualizado */ },
  "pagseguroOrderId": "ORDE_..."
}
```

### 3. Webhook de Notificação

O PagSeguro enviará notificações para:
```
POST /webhook/pagseguro/financial-title
```

Estrutura da notificação:
```javascript
{
  "id": "ORDE_...",
  "charges": [{
    "id": "CHAR_...",
    "status": "PAID" // ou WAITING, CANCELED, etc.
  }]
}
```

## Status dos Títulos

### Status Internos
- `PENDING`: Aguardando pagamento
- `PAID`: Pago
- `CANCELLED`: Cancelado
- `OVERDUE`: Vencido

### Status do PagSeguro
- `WAITING_PAYMENT`: Aguardando pagamento
- `PAID`: Pago
- `AUTHORIZED`: Autorizado
- `CANCELED`: Cancelado
- `DECLINED`: Recusado
- `IN_ANALYSIS`: Em análise

## Dados Necessários

### Para Produção
Você deve coletar e armazenar:

1. **CPF do cliente** (obrigatório)
2. **Telefone do cliente** (obrigatório)
3. **Nome completo** (obrigatório)
4. **Email** (já coletado)

### Campos a Adicionar no Modelo User

```prisma
model User {
  // ... campos existentes
  cpf       String?
  phone     String?
  // ...
}
```

## Segurança

1. **Nunca exponha o token** em código cliente
2. **Use HTTPS** em produção
3. **Valide webhooks** (implemente verificação de assinatura se necessário)
4. **Log todas as transações** para auditoria

## Testes

### Dados de Teste (Sandbox)

- **CPF**: `12345678909`
- **Telefone**: `11999999999`
- **Email**: Qualquer email válido

### Simular Pagamentos

No ambiente sandbox, acesse:
[https://billing-partner.boacompra.com](https://billing-partner.boacompra.com)

Para simular mudanças de status manualmente.

## Troubleshooting

### Erro: "Token do PagSeguro não configurado"
- Verifique se `PAGSEGURO_TOKEN` está definido no `.env`

### Erro: "whitelist access required. Contact PagSeguro"
**IMPORTANTE**: Este é o erro mais comum em desenvolvimento.

**Causa**: O PagSeguro requer que o IP do servidor esteja na whitelist para usar a API Orders.

**Soluções**:
1. **Para Produção**: Entre em contato com o PagSeguro para adicionar o IP do servidor na whitelist
2. **Para Desenvolvimento**: Use a simulação implementada (veja seção "Modo Simulação")
3. **Alternativa**: Use um servidor com IP já autorizado pelo PagSeguro

### Erro: "Erro ao gerar PIX no PagSeguro"
- Verifique os logs do servidor para detalhes
- Confirme se o token está válido
- Verifique se os dados obrigatórios estão corretos
- Confirme se o IP está na whitelist do PagSeguro

### Webhook não funciona
- Verifique se a URL está acessível publicamente
- Use ferramentas como ngrok para desenvolvimento local
- Confirme se o endpoint está registrado no PagSeguro

## Modo Simulação (Desenvolvimento)

Para contornar a limitação de whitelist durante o desenvolvimento, o sistema pode operar em modo simulação:

### Ativando a Simulação
Adicione no `.env`:
```env
PAGSEGURO_SIMULATE=true
```

### Como Funciona
- Gera códigos PIX fictícios mas válidos
- Simula QR codes
- Permite testar toda a funcionalidade
- Status pode ser alterado manualmente via webhook simulado

## Próximos Passos

1. **Implementar coleta de CPF e telefone** na interface
2. **Adicionar validação de CPF**
3. **Implementar relatórios financeiros**
4. **Adicionar notificações por email**
5. **Implementar reconciliação automática**