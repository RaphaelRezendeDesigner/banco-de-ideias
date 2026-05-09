# Banco de Ideias — Marketing Político

App web para registrar ideias, organizar pensamentos, fazer brainstorm guiado e produzir conteúdo político com auxílio de IA.

## Stack

- **Next.js 14** com App Router + TypeScript
- **Tailwind CSS** + shadcn/ui (componentes próprios)
- **Supabase** para autenticação e banco de dados
- **OpenAI / Anthropic** para geração de textos (opcional)
- **Lucide React** para ícones

---

## 1. Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- (Opcional) Chave da API OpenAI ou Anthropic

---

## 2. Instalação

```bash
cd banco-de-ideias
npm install
```

---

## 3. Variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# IA (opcional — escolha um)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Provedor: "openai" | "anthropic" | "none"
AI_PROVIDER=none
```

---

## 4. Configurar Supabase

### 4.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings → API** e copie `Project URL` e `anon public`

### 4.2 Criar as tabelas

1. No painel do Supabase, vá em **SQL Editor**
2. Cole o conteúdo do arquivo `supabase/schema.sql`
3. Clique em **Run**

Isso criará todas as tabelas com RLS habilitado.

### 4.3 Habilitar autenticação

1. Vá em **Authentication → Providers**
2. Certifique-se que **Email** está habilitado
3. Configure o **Site URL** nas configurações do Auth

---

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 6. Build para produção

```bash
npm run build
npm start
```

---

## 7. Deploy no Vercel

```bash
npx vercel
```

Configure as variáveis de ambiente no painel da Vercel.

---

## 8. Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── ideas/                # Caixa de Ideias
│   │   ├── page.tsx
│   │   └── [id]/page.tsx     # Detalhe da ideia
│   ├── brainstorm/           # Brainstorm guiado
│   │   └── page.tsx
│   ├── texts/                # Biblioteca de Textos
│   │   ├── page.tsx
│   │   └── [id]/page.tsx     # Editor de texto
│   ├── categories/           # Gerenciar categorias
│   ├── settings/             # Configurações e IA
│   ├── auth/                 # Login / Cadastro
│   └── api/ai/generate/      # API route para geração com IA
├── components/
│   ├── ui/                   # Componentes base (shadcn-style)
│   ├── layout/               # Sidebar, Header, AppLayout
│   ├── FloatingIdeaButton    # Botão flutuante de ideia rápida
│   ├── IdeaCard              # Card de ideia
│   ├── TextCard              # Card de texto
│   ├── BrainstormForm        # Formulário de brainstorm
│   ├── TextEditor            # Editor com auto-save
│   ├── AiPromptGenerator     # Gerador de prompts
│   ├── DashboardStats        # Estatísticas do dashboard
│   ├── SearchBar             # Busca global
│   └── FilterPanel           # Painel de filtros
├── lib/
│   ├── supabase/             # Cliente Supabase
│   ├── ai-service.ts         # Serviço de IA (OpenAI + Anthropic)
│   ├── utils.ts              # Helpers e utilitários
│   └── mock-data.ts          # Dados de exemplo
└── types/
    └── index.ts              # Tipos TypeScript
```

---

## 9. Funcionalidades

| Feature | Descrição |
|---|---|
| 💡 Ideia Rápida | Botão flutuante para capturar ideias em qualquer tela |
| 📦 Caixa de Ideias | Lista com filtros por categoria, status e urgência |
| 🧠 Brainstorm Guiado | Formulário estruturado para organizar pensamentos |
| 🤖 Geração com IA | Roteiros, legendas, discursos, releases via OpenAI ou Claude |
| 📝 Prompt Copiável | Gera prompt formatado para colar no ChatGPT ou Claude |
| 📚 Biblioteca | Textos com status, formato e estimativa de tempo de fala |
| 🛡️ Modo Pré-Campanha | Alertas para evitar propaganda eleitoral antecipada |
| 🏷️ Categorias | Gerenciamento de categorias com cores |
| 🔍 Busca Global | Pesquisa por título, texto, categoria e tags |

---

## 10. Modo Pré-Campanha

Quando ativado nas configurações, o app exibe um aviso no cabeçalho e monitora expressões como:

- "vote em mim"
- número de campanha
- "quando eleito"
- promessas diretas de cargo
- propaganda eleitoral antecipada

> **Importante:** Este modo não substitui análise jurídica especializada. Consulte sempre um advogado eleitoral.

---

## 11. Integração com IA

O app suporta dois provedores:

**OpenAI (GPT-4o)**
```env
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai
```

**Anthropic (Claude)**
```env
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic
```

**Sem IA integrada** — apenas gera o prompt para copiar e colar externamente:
```env
AI_PROVIDER=none
```

Tipos de conteúdo geráveis:
- Roteiros de 30s, 45s e 1 minuto
- Legendas para Instagram
- Textos institucionais
- Releases para imprensa
- Discursos curtos
- Frases de impacto
- Roteiros de carrossel

---

Desenvolvido para marketing político, comunicação de mandato e produção de conteúdo para o interior do Amazonas.
