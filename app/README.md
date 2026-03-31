# Rugby Match Pro

Sistema de gestão e arbitragem de partidas de rugby em tempo real.

🌐 **App online:** https://app-pi-blue-42.vercel.app
🔑 **Login de teste:** `teste@teste.com` / `teste123`

---

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Técnico](#stack-técnico)
- [Arquitetura](#arquitetura)
- [Banco de Dados](#banco-de-dados)
- [Perfis de Usuário](#perfis-de-usuário)
- [Sincronização Offline/Online](#sincronização-offlineonline)
- [Internacionalização](#internacionalização)
- [Rotas](#rotas)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Deploy](#deploy)

---

## Visão Geral

O **Rugby Match Pro** é um Progressive Web App (PWA) para árbitros e gestores de rugby, projetado para funcionar **offline-first** em campo, com sincronização automática com a nuvem (Supabase) quando há conexão disponível.

---

## Funcionalidades

### Partida
- ⏱ Cronômetro de jogo com controle de períodos
- 🏉 Registro de eventos (try, conversão, drop goal, penalidade, cartões, lesão)
- 📋 Escalação de jogadores por time
- 🟨 Relógio de suspensão por cartão (amarelo/vermelho temporário)
- 🏥 Relógio de atendimento médico
- 🥅 Disputa de pênaltis (penalty shootout)
- 📊 Timeline de eventos editável
- 📤 Exportação de relatório em texto

### Administração
- Confederações, Federações, Clubes
- Árbitros e Categorias
- Tipos de Jogo e Entidades Organizadoras
- Gestão de usuários

### Sistema
- 🌍 Idiomas: Português, English, Español
- 🌙 Tema claro/escuro
- 📶 Indicador de status online/offline
- 🔐 Login com email e senha + recuperação de senha

---

## Stack Técnico

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| UI | React | 19.2.3 |
| Linguagem | TypeScript | 5.x |
| Estilo | Tailwind CSS | 4.x |
| Componentes | @base-ui/react | 1.3.0 |
| Estado global | Zustand | 5.0.11 |
| Banco local | Dexie (IndexedDB) | 4.3.0 |
| Banco remoto | Supabase (PostgreSQL) | 2.100.0 |
| Deploy | Vercel | — |

---

## Arquitetura

```
Browser / PWA
│
├── React (UI)
│   └── Zustand Stores (auth / match / admin / sync)
│       └── Dexie - IndexedDB (banco local, sempre disponível)
│           │
│           └── Sync bidirecional (pull 5min / push imediato)
│               └── Supabase PostgreSQL (banco remoto / nuvem)
```

**Fluxo offline-first:**
1. Toda leitura/escrita usa o **IndexedDB** (instantâneo, sem internet)
2. Ao escrever, a alteração é **empurrada ao Supabase** imediatamente (se online)
3. Se offline → entra em **fila de pendências** (localStorage: `rmatch_pending_sync`)
4. A cada 5 minutos → **pull completo** do Supabase para o IndexedDB
5. Ao reconectar → fila de pendências é **descarregada** para o Supabase

---

## Banco de Dados

### Tabelas de Dados Mestre

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema |
| `confederations` | Confederações |
| `federations` | Federações |
| `clubs` | Clubes |
| `referees` | Árbitros |
| `categories` | Categorias de jogo |
| `game_types` | Tipos de jogo (Rugby 15, Rugby 7, etc.) |
| `organizing_entities` | Entidades organizadoras |

### Tabelas de Partida

| Tabela | Descrição |
|---|---|
| `matches` | Partidas (status, placar, período, cronômetro) |
| `match_roster` | Escalação por partida |
| `match_referees` | Árbitros designados |
| `match_events` | Eventos do jogo |
| `disciplinary_clocks` | Relógios de suspensão (cartões) |
| `medical_clocks` | Relógios de atendimento médico |
| `penalty_shootout` | Cobranças de pênaltis |
| `audit_log` | Log de auditoria |

### Status de Partida

`scheduled` → `confirmed` → `live` → `finished` / `reopened`

### Períodos

`not_started` → `first_half` → `half_time` → `second_half` → `extra_first` → `extra_half_time` → `extra_second` → `shootout` → `full_time`

---

## Perfis de Usuário

### gestor
- Gerenciar dados mestre, usuários, partidas
- Operar e reabrir partidas
- Ver auditoria e exportar

### quarto_arbitro
- Operar e reabrir partidas
- Exportar relatórios

---

## Sincronização Offline/Online

| Gatilho | Ação |
|---|---|
| App abre | Pull completo |
| A cada 5 minutos | Pull completo |
| Janela fica visível | Pull completo |
| Reconecta à internet | Pull + flush da fila |
| Qualquer escrita local | Push imediato ao Supabase |

---

## Internacionalização

3 idiomas com troca em tempo real:
- 🇧🇷 Português (padrão)
- 🇺🇸 English
- 🇪🇸 Español

Arquivos: `src/lib/translations/pt.ts`, `en.ts`, `es.ts`
Hook: `const { t, locale, setLocale } = useI18n()`

---

## Rotas

| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Login | Público |
| `/dashboard` | Lista de partidas | Autenticado |
| `/match/new` | Nova partida | gestor |
| `/match/[id]` | Operar partida ao vivo | Autenticado |
| `/match/[id]/edit` | Editar partida | gestor |
| `/admin` | Painel de administração | gestor |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Passos

```bash
# 1. Clonar
git clone https://github.com/phagentile/cestaria.git
cd cestaria/app

# 2. Instalar dependências
pnpm install

# 3. Configurar .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://vcjytwhjqfuindzvrqrs.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui" >> .env.local

# 4. Rodar
pnpm dev
```

Acesse: http://localhost:3000
Login: `teste@teste.com` / `teste123`

---

## Deploy

### Vercel (produção)

```bash
cd app
npx vercel --prod
```

### Estrutura do repositório

```
cestaria/
├── app/                    # Código-fonte Next.js
│   ├── src/
│   │   ├── app/            # Rotas (App Router)
│   │   ├── components/     # Componentes React
│   │   │   └── match/      # Componentes de partida
│   │   ├── lib/            # db.ts, sync.ts, use-sync.ts, i18n
│   │   └── stores/         # Zustand: auth, match, admin
│   ├── public/             # Assets + manifest PWA
│   └── supabase/
│       └── schema.sql      # SQL para criar o banco no Supabase
└── vercel.json             # Config de deploy
```

### Banco Supabase

Execute `app/supabase/schema.sql` no SQL Editor do Supabase para criar todas as tabelas e políticas RLS.

---

*Rugby Match Pro — gestão de partidas de rugby para árbitros e gestores.*
