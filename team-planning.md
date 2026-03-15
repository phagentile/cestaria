# Cestária — Planejamento de Equipe e Estratégia de Projeto (v2)

## Mesa de Controle de Rugby — Operação ao Vivo
### Rugby XV e Sevens | Perfis: Gestor + Quarto Árbitro | Piloto Real

---

> **Revisão 2.0** — Atualizada com as respostas do stakeholder em 15/03/2026.
> Mudanças principais: escopo do MVP refinado (sem importação PDF), dois perfis de acesso, operação offline longa, Sevens incluído, cadastros mestres, critérios de exportação, lógica de encerramento/reabertura de partida.

---

# 1. ESCOPO DO MVP

## O que ENTRA no MVP
- Protótipo funcional completo de operação de partida
- Controle de jogo (relógio, períodos, play/pause, reset, edição manual, fim de partida)
- Pontuação (todos os tipos: try, conversão, penal, drop, penal try)
- Cartões (amarelo, vermelho, vermelho temporário, relógios disciplinares)
- Substituições (todos os tipos, fluxo separado de cartões)
- Relógios médicos (sangue, HIA, sangue+HIA — tempo real)
- Timeline de eventos (CRUD completo, recálculo retroativo)
- Disputa de penais/drops (melhor de 5, morte súbita)
- Elenco/súmula (inserção manual + importação via API futura)
- Exportação de PDF (timeline de eventos + súmula oficial)
- Cadastros mestres (confederação, federação, clubes, árbitros, categoria, tipo XV/Sevens)
- Dois perfis: Gestor e Quarto Árbitro
- Autenticação e autorização
- Auditoria (histórico de alterações e registros)
- Encerramento e reabertura de partida com log
- Operação offline de longa duração
- Sincronização ao reconectar (offline sobrescreve nuvem)

## O que NÃO entra no MVP
- Importação de PDF de súmula/elenco
- Integração com Sporti (API)
- Integração com sistema da Sul-Americana (API)
- Perfis adicionais de acesso

## Diferenças XV vs. Sevens

| Aspecto | Rugby XV | Rugby Sevens |
|---------|----------|-------------|
| Duração regulamentar | 2x 40 min | 2x 7 min (ou 2x 10 min em final) |
| Jogadores em campo | 15 | 7 |
| Reservas | 8 | 5 |
| Substituições | até 8 | até 5 |
| Conversão | chute ao gol | drop kick obrigatório |
| Tempo de conversão | 90 segundos | 30-40 segundos |
| Cartão amarelo | 10 min de tempo de jogo | 2 min de tempo de jogo |
| Intervalo | 10 min | 2 min |
| Prorrogação | 2x 10 min | 2x 5 min |

> O sistema DEVE ser parametrizável por tipo de jogo. Hardcoded não é aceitável.

---

# 2. ESTRUTURA DA EQUIPE

## 2.1 Papéis Necessários

| # | Papel | Por que existe | O que entrega | Prioridade |
|---|-------|---------------|---------------|------------|
| 1 | **Product Owner (PO)** | Dono do escopo. Traduz a realidade operacional do rugby em requisitos claros e prioriza o backlog. | Backlog priorizado, critérios de aceite, validação de entrega, regras de negócio documentadas | CRÍTICA |
| 2 | **Especialista em Regras do Rugby** | As Laws of the Game do World Rugby são complexas e mudam. Erros aqui invalidam toda a operação. Precisa cobrir XV e Sevens. | Documento de regras operacionais, validação de lógica de negócio, homologação de fluxos, diferenças XV/Sevens | CRÍTICA |
| 3 | **UI/UX Designer** | O app é usado ao vivo, sob pressão, por um Quarto Árbitro que não pode errar. Interface precisa ser operacional — rápida, previsível, resistente a erros. | Wireframes, protótipos navegáveis, design system operacional, testes de usabilidade | ALTA |
| 4 | **Front-end Developer** | Lógica de cronômetros, timeline, interações em tempo real, estado do jogo, offline-first. É o core do app. | Componentes React, lógica de estado, cronômetros, interface operacional, Service Worker | CRÍTICA |
| 5 | **Back-end Developer** | Persistência, exportação de PDF, autenticação, auditoria, futura API de integração. | API REST, lógica de persistência, serviço de exportação, endpoints, auditoria | ALTA |
| 6 | **Arquiteto de Software** | Decisões de offline-first, modelo de estado, sincronização, performance. Erros de arquitetura custam meses. | Diagrama de arquitetura, stack, padrões de sincronização, estratégia de estado | ALTA |
| 7 | **DBA / Modelagem de Dados** | Dados do jogo têm relações complexas. Modelo precisa suportar edição retroativa, recálculo automático, auditoria e operação offline. | Modelo ER, migrações, queries de agregação, estratégia de consistência | ALTA |
| 8 | **QA / Tester** | Operação ao vivo não tolera bugs. Piloto real é o critério de sucesso. | Plano de testes, testes automatizados, testes de regressão, homologação com partida simulada | ALTA |
| 9 | **DevOps / Infraestrutura** | Deploy confiável, PWA com Service Worker, estratégia offline de longo prazo. | Pipeline CI/CD, infraestrutura, monitoramento, PWA config, estratégia de sync | MÉDIA |
| 10 | **Especialista em Integrações** | Futura conexão com Sporti e Sul-Americana exige contratos de API desde o início. | Contratos de API, documentação, adapter pattern para futuras plataformas | MÉDIA |
| 11 | **Segurança e Auditoria** | Dados de partida são oficiais. Auditoria de alterações e registros é obrigatória. Encerramento/reabertura logados. | Política de auditoria, log de alterações, controle de acesso por perfil (Gestor vs Quarto Árbitro) | MÉDIA |

## 2.2 Acúmulo de Papéis no MVP

| Pessoa | Papéis Acumulados | Justificativa |
|--------|-------------------|---------------|
| **Pessoa 1** | PO + Especialista Rugby | Quem entende o produto DEVE entender as regras. Precisa conhecer XV e Sevens. |
| **Pessoa 2** | Arquiteto + Back-end + DBA | Decisões de arquitetura, modelo de dados, API e sync offline são interligadas. |
| **Pessoa 3** | Front-end (dedicado) | Core do app: cronômetros, estado, offline-first, UX operacional. Foco total. |
| **Pessoa 4** | UI/UX + QA | O designer que testa garante consistência entre intenção e implementação. |
| **Pessoa 5 (parcial)** | DevOps + Segurança | Setup inicial de infra, CI/CD, PWA, auditoria. Depois atua sob demanda. |

**Equipe mínima MVP: 4 dedicadas + 1 parcial.**

---

# 3. PERFIS DE ACESSO E PERMISSÕES

## 3.1 Gestor

**Função:** Administrador do sistema. Configura o ambiente antes da operação.

| Área | Permissão |
|------|-----------|
| Cadastros mestres | CRUD de confederação, federação, clubes, árbitros, categorias, tipo de jogo |
| Partidas | Criar, configurar, visualizar todas |
| Operação ao vivo | Pode operar, mas tipicamente delega ao Quarto Árbitro |
| Encerramento | Pode reabrir partida encerrada (com log) |
| Exportação | Pode exportar relatórios |
| Usuários | Gerencia contas de Quarto Árbitro |

## 3.2 Quarto Árbitro

**Função:** Operador da mesa de controle durante a partida.

| Área | Permissão |
|------|-----------|
| Cadastros mestres | Somente leitura |
| Partida designada | Registrar TODOS os eventos ao vivo |
| Edição | Editar, reverter, excluir QUALQUER evento da partida |
| Elenco/Súmula | Gerenciar elenco e súmula (COM confirmação obrigatória) |
| Encerramento | Encerrar partida → bloqueia TODAS as alterações do próprio Quarto Árbitro |
| Reabertura | Pode reabrir partida (com log: quem encerrou, quando, quem reabriu, quando) |
| Exportação | Aprovar exportação final (critério: 80 min batidos + hora início + hora fim registradas) |

## 3.3 Regras de Confirmação

| Ação | Confirmação? | Justificativa |
|------|-------------|---------------|
| Registro de atletas e comissão | SIM | Ação de cadastro, não operacional |
| Criação de partida | SIM | Ação administrativa |
| Encerramento de partida | SIM | Irreversível (até reabertura) |
| Exclusão de eventos | SIM | Destrutiva, afeta placar |
| Reset de relógio | SIM | Destrutiva |
| Reabertura de partida | SIM | Altera estado oficial, logada |
| Registrar try/conversão/penal/drop | NÃO | Ação rápida, operação ao vivo |
| Registrar penal try | NÃO | Ação rápida |
| Registrar cartão | NÃO | Ação rápida |
| Registrar substituição | NÃO | Ação rápida |
| Play/pause do relógio | NÃO | Ação mais frequente do operador |
| Edição de evento existente | NÃO | Correção rápida na timeline |

---

# 4. LÓGICA DE ENCERRAMENTO E EXPORTAÇÃO

## 4.1 Fluxo de Encerramento

```
Quarto Árbitro clica "Encerrar Partida"
         │
         ▼
┌─────────────────────────────┐
│ Confirmação obrigatória:    │
│ "Deseja encerrar a partida?"│
└──────────┬──────────────────┘
           │ SIM
           ▼
┌─────────────────────────────┐
│ Sistema registra em log:    │
│ - Quem encerrou             │
│ - Quando encerrou           │
│ - Estado final da partida   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ PARTIDA BLOQUEADA           │
│ - Quarto Árbitro não pode   │
│   alterar NADA              │
│ - Relógios congelam         │
│ - Timeline somente leitura  │
│ - Pode exportar/visualizar  │
└─────────────────────────────┘
```

## 4.2 Fluxo de Reabertura

```
Gestor OU Quarto Árbitro clica "Reabrir Partida"
         │
         ▼
┌─────────────────────────────┐
│ Confirmação obrigatória     │
└──────────┬──────────────────┘
           │ SIM
           ▼
┌─────────────────────────────┐
│ Sistema registra em log:    │
│ - Quem reabriu              │
│ - Quando reabriu            │
│ - Que estava finalizada     │
│   desde [data/hora]         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ PARTIDA DESBLOQUEADA        │
│ Volta ao estado operacional │
└─────────────────────────────┘
```

## 4.3 Critérios de Exportação

O Quarto Árbitro pode aprovar a exportação oficial quando:
1. Partida atingiu 80 minutos (XV) ou tempo regulamentar (Sevens)
2. Hora de início da partida registrada
3. Hora de fim da partida registrada

Se qualquer critério não for atendido, o sistema exibe aviso mas **permite exportação** (pode haver situações excepcionais como jogo abandonado).

---

# 5. OPERAÇÃO OFFLINE

## 5.1 Estratégia: Local-First

O app funciona **completamente** no navegador. O servidor é backup e sincronização, não dependência.

```
┌─────────────────────────────────────────────┐
│                NAVEGADOR                     │
│                                              │
│  ┌─────────┐    ┌──────────┐    ┌────────┐ │
│  │ React   │◄──►│ Zustand  │◄──►│IndexedDB│ │
│  │ UI      │    │ Store    │    │(Dexie) │ │
│  └─────────┘    └──────────┘    └────────┘ │
│                       │                      │
│              ┌────────▼────────┐             │
│              │ Sync Queue     │             │
│              │ (operations    │             │
│              │  pendentes)    │             │
│              └────────┬────────┘             │
│                       │                      │
│              ┌────────▼────────┐             │
│              │ Service Worker │             │
│              │ (PWA)          │             │
│              └────────┬────────┘             │
└───────────────────────┼─────────────────────┘
                        │ quando online
                        ▼
               ┌─────────────────┐
               │    SERVIDOR     │
               │  PostgreSQL     │
               └─────────────────┘
```

## 5.2 Regras de Sincronização

| Cenário | Comportamento |
|---------|--------------|
| App online | Salva local + envia para servidor imediatamente |
| App offline | Salva local + enfileira operação para sync |
| Reconexão | Envia TODAS as operações pendentes (FIFO) |
| Conflito | **Offline wins** — dados locais sobrescrevem o que estava na nuvem |
| Tempo máximo de sync | 120 segundos após reconexão |
| Crash/bateria | Ao reabrir, recupera estado completo do IndexedDB |
| Partida inteira offline | Suportado. Tudo funciona. Sync ocorre quando houver internet. |

## 5.3 O que precisa funcionar 100% offline

- Play/pause/reset do relógio
- Registro de todos os tipos de evento
- Cronômetros disciplinares e médicos
- Timeline completa (CRUD + recálculo)
- Disputa de penais
- Edição/exclusão de eventos
- Geração de PDF (no navegador, sem servidor)

---

# 6. RELATÓRIOS E EXPORTAÇÃO

## 6.1 Relatório Linear de Eventos (Timeline)

Formato: `tempo | time | evento | placar time A | placar time B`

Exemplo:
```
05:23 | Time A | Try - #11 João Silva        | 5  | 0
06:45 | Time A | Conversão - #10 Pedro Santos | 7  | 0
12:30 | Time B | Penal - #10 Carlos Lima      | 7  | 3
23:15 | Time A | Cartão Amarelo - #6 Rafael   | 7  | 3
35:00 | Time B | Try - #14 André Costa        | 7  | 8
36:12 | Time B | Conversão Perdida - #10      | 7  | 8
40:00 | ---    | Fim do 1º Tempo              | 7  | 8
```

## 6.2 Súmula Oficial (PDF)

Campos obrigatórios:
- **Dados da partida:** Data, hora, local, competição, categoria, tipo (XV/Sevens)
- **Dados dos clubes:** Nome, escudo, cores
- **Dados dos atletas:** Número, nome, posição, titular/reserva, eventos (cartões, substituições, pontuação)
- **Comissão técnica:** Cargo, nome
- **Dados dos árbitros:** Nome, função (central, assistente 1, assistente 2, TMO, quarto árbitro)
- **Resultado final:** Placar, placar do 1T, placar de penais (se aplicável)

> Modelo exato do PDF será baseado no anexo fornecido pelo stakeholder.

## 6.3 Fluxo de Exportação

```
Quarto Árbitro clica "Exportar"
         │
         ▼
┌─────────────────────────────┐
│ Verifica critérios:         │
│ ✓ 80 min batidos?           │
│ ✓ Hora de início?           │
│ ✓ Hora de fim?              │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     │           │
  TODOS OK    PENDENTE
     │           │
     ▼           ▼
  Gera PDF    Aviso + permite
              gerar mesmo assim
```

---

# 7. CADASTROS MESTRES (ABA DO GESTOR)

Localizados na área administrativa do perfil Gestor:

| Cadastro | Campos | Obrigatório no MVP |
|----------|--------|-------------------|
| **Confederação** | Nome, sigla, país, logo | Sim |
| **Federação** | Nome, sigla, estado/região, confederação vinculada, logo | Sim |
| **Clubes** | Nome, sigla, cidade, federação vinculada, logo, cores | Sim |
| **Árbitros** | Nome, função habitual, federação, foto (opcional) | Sim |
| **Categorias** | Nome (adulto, juvenil, M19, M21, feminino, etc.) | Sim |
| **Tipo de Jogo** | XV ou Sevens (com parâmetros associados: duração, jogadores, substituições, cartão amarelo) | Sim |

Esses cadastros alimentam a criação de partidas e a geração de súmulas.

---

# 8. AUDITORIA

## O que é logado

| Evento | Campos registrados |
|--------|-------------------|
| Criação de registro | Entidade, ID, valores, quem, quando |
| Edição de registro | Entidade, ID, campo alterado, valor anterior, valor novo, quem, quando |
| Exclusão de registro | Entidade, ID, valores no momento da exclusão, quem, quando |
| Encerramento de partida | Match ID, quem, quando, estado final |
| Reabertura de partida | Match ID, quem, quando, quem havia encerrado, quando havia sido encerrado |
| Login/logout | User ID, quando, IP |

## Retenção
- Logs de auditoria **nunca são excluídos**
- Mesmo exclusão de eventos é soft delete (mantém registro para auditoria)

---

# 9. VISÃO DE CADA ÁREA (REFINADA)

## 9.1 Front-end

**Mudanças em relação à v1:**
- **Offline-first é requisito primário, não complementar.** O app DEVE funcionar por uma partida inteira (80+ min) sem internet. Isso significa: toda lógica de negócio no front-end, persistência em IndexedDB, Service Worker para PWA.
- **Geração de PDF deve funcionar no navegador.** Não pode depender do servidor.
- **Suporte a XV e Sevens.** Parâmetros de jogo (duração, jogadores, cartão amarelo) configuráveis.
- **SLA de 120ms.** Toda interação do operador deve responder em < 120ms.

**Entregas adicionais:**
- Service Worker com Workbox (PWA offline completo)
- Persistência Dexie.js com sync queue
- Geração de PDF no browser (@react-pdf/renderer)
- Parametrização por tipo de jogo (XV vs Sevens)
- Tela de cadastros mestres (Gestor)
- Fluxo de encerramento/reabertura com log

## 9.2 Back-end

**Mudanças em relação à v1:**
- **Servidor é secundário.** O front-end é local-first. O back-end recebe dados sincronizados.
- **Importação de PDF removida do MVP.**
- **Sync endpoint.** Deve aceitar batch de operações offline e aplicar em ordem.
- **Lógica de conflito simples:** offline wins (sobrescreve).

**Entregas adicionais:**
- Endpoint de sync (`POST /api/v1/sync`) para receber batch de operações
- CRUD de cadastros mestres
- Controle de acesso por perfil (Gestor vs Quarto Árbitro)
- Audit log persistente

## 9.3 Banco de Dados

**Modelo atualizado com cadastros mestres:**

```
CADASTROS MESTRES (gerenciados pelo Gestor)
├── Confederation (id, name, acronym, country, logo_url)
├── Federation (id, name, acronym, region, confederation_id, logo_url)
├── Club (id, name, acronym, city, federation_id, logo_url, primary_color, secondary_color)
├── Referee (id, name, role, federation_id, photo_url?)
├── Category (id, name, description)
└── GameType (id, name: 'XV' | 'Sevens', config: JSONB)
    └── config: { half_duration, players, reserves, max_subs,
                  yellow_card_minutes, extra_time_duration, ... }

PARTIDA
├── Match
│   ├── id, home_club_id, away_club_id, game_type_id, category_id
│   ├── competition_name?, venue, date, start_time?, end_time?
│   ├── status: scheduled | live | finished | reopened
│   ├── closed_at?, closed_by?, reopened_at?, reopened_by?
│   ├── clock_seconds, clock_running
│   └── operated_by (user_id do Quarto Árbitro)
│
├── MatchRoster (elenco por time por partida)
│   ├── match_id, club_id, player_name, shirt_number, position
│   ├── role: starter | reserve | staff
│   ├── staff_role? (técnico, auxiliar, médico, fisio, etc.)
│   └── active (boolean)
│
├── MatchReferee (árbitros da partida)
│   ├── match_id, referee_id, role_in_match (central, AR1, AR2, TMO, 4th)
│
├── MatchEvent (timeline — mesma estrutura da v1)
│
├── DisciplinaryClock (mesma estrutura, com ajuste para Sevens: 2 min)
│
├── MedicalClock (mesma estrutura)
│
├── PenaltyShootout (mesma estrutura)
│
├── SyncQueue (fila de operações offline)
│   ├── id, operation_type, entity, payload, created_at, synced_at?
│
└── AuditLog (expandido com encerramento/reabertura)
```

## 9.4 UI/UX

**Mudanças em relação à v1:**
- **Dois contextos de UI distintos:** Área administrativa (Gestor — cadastros, criação de partida) e Área operacional (Quarto Árbitro — mesa de controle ao vivo).
- **Responsivo obrigatório:** Deve funcionar em desktop, tablet e mobile.
- **Indicador de status online/offline** sempre visível.
- **Indicador de sync pendente** quando offline.

**Fluxos de UI:**

```
LOGIN
  │
  ├── GESTOR → Dashboard Administrativo
  │     ├── Cadastros Mestres (Confederação, Federação, Clubes, Árbitros, Categorias)
  │     ├── Criar Partida (com confirmação)
  │     ├── Lista de Partidas
  │     └── Perfil / Configurações
  │
  └── QUARTO ÁRBITRO → Lista de Partidas Designadas
        └── Entrar na Partida → MESA DE CONTROLE
              ├── Cabeçalho: Placar + Relógio + Período + Botão Encerrar
              ├── Painel de Ações: Pontuação | Cartões | Substituições
              ├── Cronômetros Ativos: Disciplinares + Médicos
              ├── Timeline de Eventos
              ├── Elenco/Súmula
              ├── Penais/Drops (quando aplicável)
              └── Exportação
```

## 9.5 QA

**Cenários adicionais obrigatórios:**
1. Partida de Sevens completa (2x 7 min, cartão amarelo de 2 min, 7 jogadores)
2. Operação 100% offline: iniciar partida sem internet → registrar eventos → reconectar → sync
3. Crash + recuperação: fechar aba no meio da partida → reabrir → estado intacto
4. Encerrar partida → verificar que TUDO está bloqueado → reabrir → verificar que voltou
5. Critérios de exportação: tentar exportar sem hora de início → verificar aviso
6. Cadastros mestres: criar confederação → federação → clube → verificar vínculo
7. Dois perfis: logar como Gestor vs Quarto Árbitro → verificar permissões diferentes
8. Sync com 50+ operações pendentes → verificar que todas são aplicadas em ordem
9. Responsividade: testar em desktop, tablet e mobile
10. Latência: toda interação < 120ms no dispositivo

---

# 10. FASES DO PROJETO (REFINADAS)

## Fase 1: Descoberta e Definição (2 semanas)

| Item | Detalhe |
|------|---------|
| **Participantes** | PO, Especialista Rugby, UI/UX, Arquiteto |
| **Entrega** | Documento de regras operacionais (XV + Sevens), user stories priorizadas, fluxogramas de cenários complexos, wireframes de baixa fidelidade, modelo do PDF da súmula |
| **Critério de aceite** | PO e Especialista validam que TODAS as regras de XV e Sevens estão documentadas. Wireframes cobrem todos os módulos. Modelo de súmula aprovado. |

## Fase 2: Arquitetura e Modelagem (1 semana)

| Item | Detalhe |
|------|---------|
| **Participantes** | Arquiteto, Back-end, DBA, Front-end |
| **Entrega** | Diagrama de arquitetura offline-first, modelo ER (com cadastros mestres), contratos de API, estratégia de sync, estrutura de projeto |
| **Critério de aceite** | Modelo suporta XV e Sevens. Estratégia offline cobre partida inteira. API cobre todos os CRUDs + sync. |

## Fase 3: Prototipação de UI (1-2 semanas, paralela com Fase 2)

| Item | Detalhe |
|------|---------|
| **Participantes** | UI/UX, PO, Especialista Rugby |
| **Entrega** | Protótipo navegável com dois fluxos: Gestor (administrativo) e Quarto Árbitro (operação). Design system. |
| **Critério de aceite** | PO simula: (1) cadastrar confederação/federação/clube, (2) criar partida, (3) operar partida completa, (4) encerrar e exportar. |

## Fase 4: Desenvolvimento MVP (8-10 semanas)

**Sprint 1-2: Fundação + Cadastros**
- Setup do projeto, CI/CD, autenticação (Gestor + Quarto Árbitro)
- Layout principal responsivo
- Cadastros mestres CRUD completo
- Criação de partida
- IndexedDB + Service Worker setup

**Sprint 3-4: Core operacional**
- Relógio com play/pause/reset/edição manual
- Pontuação (todos os tipos)
- Timeline de eventos (CRUD + recálculo)
- Persistência offline de estado

**Sprint 5-6: Cartões + Substituições + Médicos**
- Cartões (com cronômetros disciplinares, XV e Sevens)
- Substituições (todos os tipos)
- Relógios médicos (tempo real)
- Elenco/Súmula (inserção manual)

**Sprint 7-8: Penais + Encerramento + Exportação**
- Disputa de penais/drops
- Prorrogação
- Encerramento/reabertura com log
- Exportação de PDF (timeline + súmula) no browser
- Critérios de aprovação do Quarto Árbitro

**Sprint 9-10: Offline + Sync + Polish**
- Sync completo (batch de operações, offline wins)
- Testes de resiliência offline
- Auditoria completa
- Responsividade mobile/tablet
- Performance tuning (< 120ms)

## Fase 5: Testes e Homologação (2 semanas)

| Item | Detalhe |
|------|---------|
| **Participantes** | QA, PO, Especialista Rugby, toda a equipe |
| **Entrega** | Suite de testes, partida simulada XV + Sevens, teste offline completo, teste de perfis |
| **Critério de aceite** | Zero bugs críticos. Partida completa XV + Sevens simulada. Offline 80+ min testado. Perfis validados. |

## Fase 6: Implantação (1 semana)

| Item | Detalhe |
|------|---------|
| **Participantes** | DevOps, Back-end, Front-end |
| **Entrega** | Ambiente de produção, PWA publicada, monitoramento, backup |
| **Critério de aceite** | App acessível como PWA. Sentry configurado. Backup automático. |

## Fase 7: Piloto Real (2-4 semanas)

| Item | Detalhe |
|------|---------|
| **Participantes** | Toda a equipe + Quarto Árbitro real |
| **Entrega** | Uso em partida real, feedback coletado, correções aplicadas |
| **Critério de aceite** | App usado com sucesso em 3+ partidas reais (pelo menos 1 XV e 1 Sevens). Feedback coletado e priorizado. |

**Timeline total: 17-22 semanas do início ao piloto real.**

---

# 11. DIVISÃO EM MÓDULOS (ATUALIZADA)

```
cestaria/
├── src/
│   ├── modules/
│   │   ├── auth/                   # Módulo 0: Autenticação
│   │   │   ├── components/         # Login, perfil
│   │   │   ├── store/              # Sessão, perfil ativo
│   │   │   └── logic/              # Verificação de permissões por perfil
│   │   │
│   │   ├── admin/                  # Módulo 1: Cadastros Mestres (Gestor)
│   │   │   ├── components/         # CRUD de confederação, federação, clube, árbitro, categoria
│   │   │   ├── store/              # Estado dos cadastros
│   │   │   └── logic/              # Validações, vínculos entre entidades
│   │   │
│   │   ├── match-setup/            # Módulo 2: Criação de Partida
│   │   │   ├── components/         # Formulário de criação (com confirmação)
│   │   │   ├── store/              # Partidas criadas
│   │   │   └── logic/              # Validação, parametrização XV/Sevens
│   │   │
│   │   ├── match-control/          # Módulo 3: Controle de Jogo (ao vivo)
│   │   │   ├── components/         # Relógio, controles de período, play/pause
│   │   │   ├── hooks/              # useGameClock, useMatchStatus
│   │   │   ├── store/              # Estado do jogo (período, tempo, status)
│   │   │   └── logic/              # Regras de transição, parametrização XV/Sevens
│   │   │
│   │   ├── scoring/                # Módulo 4: Pontuação
│   │   ├── cards/                  # Módulo 5: Cartões + Relógios Disciplinares
│   │   ├── substitutions/          # Módulo 6: Substituições
│   │   ├── medical/                # Módulo 7: Relógios Médicos
│   │   ├── roster/                 # Módulo 8: Elenco/Súmula
│   │   ├── timeline/               # Módulo 9: Timeline de Eventos
│   │   ├── shootout/               # Módulo 10: Penais/Drops
│   │   ├── export/                 # Módulo 11: Exportação de PDF (no browser)
│   │   ├── match-closure/          # Módulo 12: Encerramento/Reabertura
│   │   │   ├── components/         # Botão encerrar, confirmação, reabertura
│   │   │   ├── store/              # Estado de bloqueio
│   │   │   └── logic/              # Regras de encerramento, critérios de exportação
│   │   │
│   │   └── audit/                  # Módulo 13: Auditoria
│   │       ├── components/         # Visualização de logs (Gestor)
│   │       ├── store/              # Logs locais
│   │       └── logic/              # Interceptor de operações para log automático
│   │
│   ├── offline/                    # Infraestrutura offline
│   │   ├── db/                     # Dexie.js schemas e migrations
│   │   ├── sync/                   # Sync queue, batch upload, conflict resolution
│   │   └── sw/                     # Service Worker config (Workbox)
│   │
│   ├── shared/                     # Compartilhado
│   │   ├── components/             # Botões, modais, inputs, timers, indicators
│   │   ├── hooks/                  # useTimer, useConfirmation, useOnlineStatus
│   │   ├── types/                  # Types globais
│   │   ├── utils/                  # Formatação, cálculos
│   │   ├── constants/              # Pontuações, durações, configs XV/Sevens
│   │   └── permissions/            # Guards de permissão por perfil
│   │
│   ├── api/                        # Camada de comunicação com back-end
│   ├── store/                      # Store global
│   └── app/                        # Layout principal, rotas
│
├── server/                         # Back-end
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── sync/                       # Endpoint de sincronização
│   ├── audit/                      # Persistência de audit log
│   └── middleware/                  # Auth, permissions, rate limiting
│
└── database/
    ├── migrations/
    └── seeds/
```

---

# 12. RISCOS E PONTOS CRÍTICOS (ATUALIZADOS)

## 12.1 Offline de Longa Duração (RISCO #1 — NOVO)

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| IndexedDB corrompido durante partida offline | PERDA TOTAL de dados da partida | Auto-save redundante (IndexedDB + localStorage como backup). Verificação de integridade ao iniciar. |
| Service Worker não instalado / navegador sem suporte | App não funciona offline | Verificação na inicialização. PWA manifest obrigatório. Tela de erro clara. |
| Bateria acaba durante partida offline | Dados em memória perdidos | Salvar em IndexedDB a CADA evento (não batch). Ao reabrir, restaura estado do último save. |
| Sync de 80+ min de dados falha | Dados presos no dispositivo | Retry com exponential backoff. Exportação local como fallback (PDF gerado no browser). |
| Dois dispositivos operaram a mesma partida offline | Conflito irreconciliável | MVP: lock por partida (1 operador). Indicador visual de quem está operando. |

## 12.2 Dualidade XV vs. Sevens (RISCO #2 — NOVO)

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Parâmetros de Sevens (2 min amarelo, 7 jogadores) hardcoded | Sevens funciona errado ou XV com valores de Sevens | Configuração via `GameType.config` JSONB. NUNCA hardcoded. |
| UI não adapta para 7 jogadores | Lista de elenco confusa | Componente de elenco parametrizado por `game_type.players` |
| Conversão por drop kick no Sevens não diferenciada | Regra errada registrada | Tipo de evento `conversion_drop` disponível quando tipo = Sevens |

## 12.3 Timers (mantido como risco alto)

Mesma análise da v1, com adição:
- **Cartão amarelo no Sevens = 2 min**, não 10. Parametrizar pelo tipo de jogo.

## 12.4 Sincronização "Offline Wins"

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Gestor alterou cadastro mestre enquanto Quarto Árbitro estava offline | Dados mestres divergem | Cadastros mestres são readonly offline. Apenas dados de partida são "offline wins". |
| Duas partidas diferentes sincronizam simultaneamente | Conflito de IDs | UUIDs gerados no client. Zero dependência de IDs sequenciais do servidor. |
| Sync parcial (internet cai no meio do batch) | Dados inconsistentes no servidor | Sync transacional: tudo ou nada. Retry do batch inteiro se falhar. |

## 12.5 Demais riscos (mantidos da v1)
- UX operacional
- Consistência de dados / recálculo
- Exportação de PDF
- Integração futura (Sporti, Sul-Americana)

---

# 13. STACK RECOMENDADA (REFINADA)

## 13.1 Stack Principal

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Front-end** | **Next.js 14+ (App Router)** | PWA com SSR para landing. Core operacional é SPA client-side. |
| **Linguagem** | **TypeScript** | Type safety é crítica com XV/Sevens parametrizáveis e tipos de evento variados. |
| **Estado** | **Zustand** com middleware de persistência | Stores por módulo. Middleware Dexie.js para auto-save em IndexedDB. |
| **UI** | **shadcn/ui + Tailwind CSS** | Componentes acessíveis, customizáveis, responsivos. |
| **Offline DB** | **Dexie.js (IndexedDB)** | Abstração madura. Suporta queries, versionamento, sync primitives. |
| **PWA** | **Workbox + next-pwa** | Service Worker para cache de assets e funcionamento offline completo. |
| **PDF (browser)** | **@react-pdf/renderer** | Gera PDF no navegador sem servidor. Essencial para offline. |
| **Back-end** | **Next.js API Routes + tRPC** | Type-safe end-to-end. Mesmo deploy que o front. Simplifica infra. |
| **Banco** | **PostgreSQL** (via Neon ou Supabase) | JSONB para config de tipo de jogo. Relacional para integridade. |
| **ORM** | **Drizzle ORM** | Type-safe, leve, SQL puro quando necessário. |
| **Auth** | **Auth.js (NextAuth v5)** | 2 perfis (Gestor + Quarto Árbitro). JWT para operação offline. |
| **Testes** | **Vitest + Testing Library + Playwright** | Unit + integration + E2E. |
| **CI/CD** | **GitHub Actions** | Lint + typecheck + testes em cada PR. |
| **Monitoramento** | **Sentry** | Erros + performance. Free tier generoso. |

## 13.2 Hospedagem (Baixo Custo)

| Componente | Recomendação | Custo |
|-----------|-------------|-------|
| **App (front + API)** | **Vercel** | Free (hobby) ou $20/mês (pro) |
| **Banco** | **Neon PostgreSQL** | Free (512MB) |
| **Armazenamento** | **Cloudflare R2** | Free (10GB) |

**Custo MVP: R$ 0/mês** (free tiers)
**Custo produção: R$ 100-200/mês**

## 13.3 Por que JWT para auth offline

O Quarto Árbitro pode ficar 80+ min sem internet. Sessões baseadas em cookie/servidor expirariam. JWT com refresh token de longa duração permite:
- Autenticação verificável sem servidor
- Permissões embarcadas no token
- Renovação quando reconectar

---

# 14. INTEGRAÇÕES FUTURAS (PÓS-MVP)

## Sporti

| Direção | Dados | Formato |
|---------|-------|---------|
| **Import** | Clubes, atletas, comissão técnica, árbitros | API REST (a definir) |
| **Export** | Registros da partida (eventos, placar, súmula) | API REST (a definir) |

## Sistema da Sul-Americana

| Direção | Dados | Formato |
|---------|-------|---------|
| **Import** | Clubes, atletas, comissão técnica, árbitros | API REST (a definir) |
| **Export** | Registros da partida (eventos, placar, súmula) | API REST (a definir) |

**Arquitetura preparada:** Adapter pattern com interface comum. Quando as APIs forem definidas, basta implementar o adapter específico sem alterar o core do sistema.

---

# 15. OBSERVABILIDADE DO PILOTO

| Métrica | Meta | Como medir |
|---------|------|-----------|
| Latência de interação | < 120ms | Performance Observer API no browser |
| Taxa de falha | Baixa (< 1%) | Sentry error tracking |
| Sincronização | 100% dos eventos sync em < 120s | Log de sync queue com timestamps |
| Perda de evento | Zero | Comparação IndexedDB local vs PostgreSQL após sync |
| Disponibilidade offline | 100% das features core | Teste em partida real sem internet |

---

# 16. RESUMO EXECUTIVO (ATUALIZADO)

| Pergunta | Resposta |
|----------|----------|
| O que é? | Mesa de controle de rugby para XV e Sevens, operada pelo Quarto Árbitro |
| MVP inclui? | Tudo exceto importação PDF e integrações API |
| Quem opera? | Quarto Árbitro (operação) + Gestor (administração) |
| Funciona offline? | Sim, por partida inteira. Sync ao reconectar. |
| Equipe mínima? | 4 dedicadas + 1 parcial |
| Timeline? | 17-22 semanas até piloto real |
| Custo de infra? | R$ 0/mês no MVP |
| Maior risco? | Offline de longa duração + dualidade de cronômetros |
| Critério de sucesso? | Piloto real: 3+ partidas (XV + Sevens) sem falhas |

---

*Documento atualizado em 15/03/2026 — v2.0 com respostas do stakeholder.*
