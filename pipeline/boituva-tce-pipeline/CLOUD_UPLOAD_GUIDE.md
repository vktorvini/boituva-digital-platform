# Guia de Upload de Dados para Supabase

## Configuração

A pipeline utiliza uma variável de ambiente chamada `DATABASE_URL`
para conectar ao banco PostgreSQL do Supabase.

A credencial real deve ficar somente no arquivo `.env`.

Exemplo:

```env
DATABASE_URL=postgresql://postgres:<SUA_SENHA>@<SEU_HOST>:5432/postgres