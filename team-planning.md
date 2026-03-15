# Cestária — Planejamento de Equipe e Estratégia de Projeto

## Mesa de Controle de Rugby — Operação ao Vivo

---

# 1. ESTRUTURA DA EQUIPE

## 1.1 Papéis Necessários

| # | Papel | Por que existe | O que entrega | Prioridade |
|---|-------|---------------|---------------|------------|
| 1 | **Product Owner (PO)** | É o dono do escopo. Traduz a realidade operacional do rugby em requisitos claros. Sem PO, o time constrói a coisa errada. | Backlog priorizado, critérios de aceite, validação de entrega | CRÍTICA |
| 2 | **Especialista em Regras do Rugby** | As regras do World Rugby (especialmente Lei 9 — jogo desleal, Lei 3 — substituições, e a lógica de períodos) são complexas e mudam. Erros aqui invalidam toda a operação. | Documento de regras operacionais, validação de lógica de negócio, homologação de fluxos | CRÍTICA |
| 3 | **UI/UX Designer** | O app é usado ao vivo, sob pressão, por um operador que não pode errar. A interface precisa ser operacional, não bonita — precisa ser rápida, previsível e resistente a erros. | Wireframes, protótipos navegáveis, design system operacional, testes de usabilidade | ALTA |
| 4 | **Front-end Developer** | Toda a lógica de cronômetros, timeline, interações em tempo real e estado do jogo vive no front-end. É o core do app. | Componentes React, lógica de estado, cronômetros, interface operacional funcional | CRÍTICA |
| 5 | **Back-end Developer** | Persistência, exportação de PDF, autenticação, futura API de integração com plataformas de competição. | API REST, lógica de persistência, serviço de exportação, endpoints de integração | ALTA |
| 6 | **Arquiteto de Software** | Decisões estruturais que afetam manutenibilidade, performance em tempo real e escalabilidade. Erros de arquitetura custam meses. | Diagrama de arquitetura, definição de stack, padrões de comunicação, estratégia de estado | ALTA |
| 7 | **DBA / Modelagem de Dados** | Os dados do jogo (eventos, cronômetros, elenco) têm relações complexas. O modelo precisa suportar edição retroativa com recálculo automático. | Modelo ER, migrações, queries de agregação, estratégia de consistência | ALTA |
| 8 | **QA / Tester** | Operação ao vivo não tolera bugs. Cronômetros, recálculo de placar e cartões disciplinares precisam funcionar perfeitamente. | Plano de testes, testes automatizados, testes de regressão, homologação | ALTA |
| 9 | **DevOps / Infraestrutura** | Deploy confiável, baixa latência, estratégia offline-first para locais sem internet estável (estádios). | Pipeline CI/CD, infraestrutura, monitoramento, estratégia offline | MÉDIA |
| 10 | **Especialista em Integrações** | Futura conexão com plataformas de competição exige padrões de API e contratos bem definidos desde o início. | Contratos de API, documentação de integração, adaptadores | MÉDIA (mas precisa ser planejada desde o início) |
| 11 | **Segurança e Auditoria** | Dados de partida são oficiais. Precisam ser auditáveis, íntegros e protegidos contra manipulação. | Política de auditoria, log de alterações, controle de acesso, criptografia de dados sensíveis | MÉDIA |

## 1.2 Acúmulo de Papéis na Fase Inicial

Para um MVP realista, a equipe pode ser condensada:

| Pessoa | Papéis Acumulados | Justificativa |
|--------|-------------------|---------------|
| **Pessoa 1** | PO + Especialista Rugby | Quem entende o produto DEVE entender as regras. Na fase inicial, uma pessoa que conheça rugby e produto conduz ambos. |
| **Pessoa 2** | Arquiteto + Back-end + DBA | As decisões de arquitetura, modelo de dados e API são interligadas. Um dev sênior full-stack cobre isso. |
| **Pessoa 3** | Front-end (dedicado) | O front-end é o core. Cronômetros em tempo real, gerenciamento de estado complexo e UX operacional exigem foco total. |
| **Pessoa 4** | UI/UX + QA | O designer que testa o que desenhou garante consistência entre intenção e implementação. |
| **Pessoa 5 (parcial)** | DevOps + Segurança | Configuração inicial de infra e CI/CD, depois atua sob demanda. |

**Equipe mínima MVP: 4 pessoas dedicadas + 1 parcial.**

---

# 2. VISÃO DE CADA ÁREA

## 2.1 Front-end

**Responsabilidade central:** Toda a experiência de operação ao vivo.

**Desafios específicos:**
- **Cronômetros múltiplos e simultâneos:** Relógio principal (tempo de jogo), relógios disciplinares (amarelo 10min, vermelho temporário 20min — pausam com o jogo), relógios médicos (sangue 15min, HIA 12min, sangue+HIA 17min — NÃO pausam com o jogo). Isso exige um sistema de timers com duas categorias distintas de comportamento.
- **Estado do jogo complexo:** Período atual, placar, lista de eventos, elenco ativo (com substituições), cartões vigentes, penais em andamento — tudo interligado.
- **Operação sob pressão:** O operador clica rápido, não pode ter latência visual, não pode ter confirmações desnecessárias (exceto ações destrutivas como reset/exclusão).
- **Recálculo retroativo:** Excluir um try da timeline deve recalcular o placar automaticamente.
- **Disputa de penais/drops:** Interface de melhor de 5 com morte súbita, clicável por tentativa, resultado exibido entre parênteses ao lado do placar.

**Entregas:**
- Componente de relógio universal (configurável: tempo de jogo vs. tempo real, pausável vs. contínuo)
- Painel de controle principal (placar, período, ações rápidas)
- Timeline de eventos (CRUD com recálculo)
- Módulo de cartões (com seleção de motivo Lei 9)
- Módulo de substituições (fluxo separado de cartões, tipos específicos de rugby)
- Módulo de penais/drops (interface de disputa)
- Módulo de elenco/súmula (importação PDF, edição manual)
- Exportação (acionamento de geração de PDF)

**Padrões obrigatórios:**
- Estado centralizado (Zustand ou Redux Toolkit)
- Timers baseados em `requestAnimationFrame` ou `setInterval` com drift correction
- Separação clara entre lógica de negócio (regras do rugby) e lógica de UI
- Persistência local (IndexedDB/localStorage) para resiliência offline

## 2.2 Back-end

**Responsabilidade central:** Persistência, exportação e futura integração.

**Desafios específicos:**
- **Geração de PDF:** Três formatos de exportação com layouts diferentes. Precisa suportar logos, tabelas e formatação oficial.
- **Auditoria:** Toda alteração em um registro de partida deve ser logada (quem, quando, o quê, valor anterior, valor novo).
- **API de integração futura:** Os endpoints devem ser desenhados desde o início com contratos que permitam integração com plataformas de competição (importação de campeonato, equipes, partidas).
- **Importação de PDF de elenco:** Parser de PDF para extrair lista de jogadores (posição, número, nome).

**Entregas:**
- API REST para CRUD de partidas, eventos, elencos
- Serviço de geração de PDF (3 formatos)
- Serviço de importação/parsing de PDF
- Sistema de auditoria (audit log)
- Endpoints preparados para integração futura
- Autenticação e autorização

**Padrões obrigatórios:**
- Versionamento de API desde o dia 1 (`/api/v1/`)
- Respostas padronizadas com envelope (`{ data, error, meta }`)
- Validação de entrada com schemas (Zod ou similar)
- Separação entre camada de rota, serviço e repositório

## 2.3 UI/UX

**Responsabilidade central:** Criar uma interface operacional, não decorativa.

**Princípios fundamentais:**
- **Operação ao vivo = zero fricção.** Cada clique a mais é um erro em potencial.
- **Hierarquia visual por urgência:** Placar e relógio são primários. Timeline é secundária. Elenco é terciário.
- **Prevenção de erro > recuperação de erro.** Confirmação apenas para ações destrutivas (reset, exclusão, fim de partida). Para ações aditivas (registrar try, cartão), zero fricção.
- **Feedback imediato:** Toda ação deve ter resposta visual em < 100ms.
- **Acessibilidade operacional:** Contraste alto, fontes grandes para relógio/placar, áreas de toque generosas.

**Entregas:**
- Mapa de fluxos operacionais (como o operador navega em cada cenário)
- Wireframes de baixa fidelidade para validação com PO
- Protótipo de alta fidelidade navegável
- Design system operacional (cores de status, tipografia, espaçamento, componentes)
- Guia de estados (jogo pausado, cartão ativo, prorrogação, penais)
- Testes de usabilidade com operador real (se possível)

**Decisões de UX críticas que o time precisa resolver:**
1. Layout de tela única vs. abas/painéis? (Recomendo: tela única com painéis colapsáveis)
2. Como exibir múltiplos cronômetros disciplinares simultâneos? (Até 3 amarelos + vermelhos temporários ao mesmo tempo)
3. Como diferenciar visualmente cartão para atleta vs. staff?
4. Como exibir a disputa de penais sem poluir o painel principal?
5. Como garantir que o operador saiba em qual período está sem precisar pensar?

## 2.4 Banco de Dados

**Responsabilidade central:** Modelo relacional que suporte a complexidade do rugby e permita recálculo retroativo.

**Entidades principais:**

```
Match (partida)
├── id, home_team_id, away_team_id, competition_id?, venue, date
├── status: scheduled | first_half | half_time | second_half | extra_time | penalties | finished
├── clock_seconds, clock_running (boolean)
│
├── MatchRoster (elenco por partida)
│   ├── player_id, team_id, shirt_number, position
│   ├── role: starter | reserve | staff
│   └── active (boolean — muda com substituições)
│
├── MatchEvent (timeline)
│   ├── id, match_id, team_id, player_id?, minute, second
│   ├── event_type: try | conversion_made | conversion_missed | penalty_kick_made |
│   │   penalty_kick_missed | drop_goal_made | drop_goal_missed | penalty_try |
│   │   yellow_card | red_card | temp_red_card | substitution_in | substitution_out |
│   │   blood_time_start | blood_time_end | hia_start | hia_end | period_start | period_end
│   ├── points (calculado pelo tipo)
│   ├── metadata (JSONB — motivo Lei 9, descrição, tipo de substituição, etc.)
│   └── created_at, updated_at, deleted_at (soft delete para auditoria)
│
├── DisciplinaryClock (relógios disciplinares ativos)
│   ├── event_id (referência ao cartão), player_id, team_id
│   ├── type: yellow | temp_red
│   ├── duration_seconds (600 para amarelo, 1200 para vermelho temporário)
│   ├── elapsed_game_seconds (acumula apenas quando relógio do jogo roda)
│   └── status: active | expired | cancelled
│
├── MedicalClock (relógios médicos ativos)
│   ├── event_id, player_id, team_id
│   ├── type: blood | hia | blood_hia
│   ├── duration_seconds (900 | 720 | 1020)
│   ├── started_at (timestamp real — conta em tempo real)
│   └── status: active | expired | cancelled
│
├── PenaltyShootout (disputa de penais)
│   ├── round, team_id, player_id?, result: made | missed
│   └── order (1-5 para fase normal, 6+ para morte súbita)
│
└── AuditLog
    ├── entity, entity_id, action, field, old_value, new_value
    ├── user_id, timestamp
    └── ip_address?
```

**Regras de integridade:**
- Placar é SEMPRE calculado somando `points` dos `MatchEvent` onde `deleted_at IS NULL`. Nunca armazenado como campo fixo.
- Excluir evento (soft delete) = recalcular placar automaticamente.
- Relógio disciplinar acumula tempo de jogo. Se o jogo pausa, o relógio disciplinar pausa. Isso é controlado pelo campo `elapsed_game_seconds` que só incrementa quando `match.clock_running = true`.
- Relógio médico usa `started_at` real e conta em tempo real independente do jogo.

## 2.5 Produto / Regras de Negócio

**Responsabilidade central:** Garantir que o app reflita fielmente as Laws of the Game do World Rugby.

**Documentos de referência obrigatórios:**
- World Rugby Laws of the Game (atualização vigente)
- Regulamento específico da competição (pode variar duração de tempos, número de substituições, regras de HIA)
- Diretrizes de Match Commissioner / Match Officials

**Regras de negócio críticas que precisam estar documentadas antes de qualquer código:**

| Regra | Detalhe | Impacto no Sistema |
|-------|---------|-------------------|
| Pontuação | Try = 5, Conversão = 2, Penal = 3, Drop = 3, Penal Try = 7 (automático) | Tabela de pontos por tipo de evento |
| Penal Try | Não tem jogador. Número 00. Conversão não é tentada. | UI não pede jogador, não habilita conversão |
| Cartão Amarelo | 10 min de tempo de jogo | Timer pausável com jogo |
| Vermelho Temporário | 20 min de tempo de jogo (regra experimental World Rugby) | Timer pausável com jogo, lógica diferente de vermelho definitivo |
| Vermelho Definitivo | Sem retorno | Sem timer, jogador removido permanentemente |
| Substituição por Sangue | Temporária. Relógio de 15 min em tempo real | Timer independente, jogador pode retornar |
| Substituição por HIA | Temporária. Relógio de 12 min em tempo real | Timer independente, jogador pode retornar ou ser substituído definitivamente |
| Sangue + HIA | Relógio de 17 min em tempo real | Timer independente, combina ambas situações |
| Front Row | Substituição específica para pilares/hooker. Pode ser não-contestada se não houver substituto qualificado | Afeta regras de scrum |
| Períodos | 1T: 00:00→40:00, 2T: 40:00→80:00, Prorrogação: 00:00→ | Lógica de exibição e persistência de tempo |
| Penais/Drops | Melhor de 5, morte súbita em empate | Interface específica, lógica de encerramento |

**Entregáveis do PO:**
- Documento de regras operacionais (validado com especialista)
- User stories com critérios de aceite detalhados
- Matriz de tipos de evento com atributos obrigatórios/opcionais
- Fluxogramas dos cenários mais complexos (substituição + cartão, HIA que vira substituição definitiva)

## 2.6 QA / Testes

**Responsabilidade central:** Garantir que o app funcione corretamente sob todas as combinações de eventos de uma partida real.

**Estratégia de testes:**

| Nível | O que testa | Ferramenta sugerida | Exemplos |
|-------|------------|-------------------|----------|
| Unitário | Lógica de negócio pura | Vitest | Cálculo de placar, lógica de timer, validação de substituição |
| Integração | Fluxos completos | Testing Library + MSW | Registrar try → atualizar placar → aparecer na timeline |
| E2E | Cenários operacionais reais | Playwright | Partida completa: início → eventos → fim → exportação |
| Visual | Consistência de UI | Storybook + Chromatic | Componentes em todos os estados |
| Performance | Timers e responsividade | Lighthouse + custom benchmarks | Drift de cronômetro < 50ms após 40 min |
| Regressão | Nada quebra ao adicionar feature | CI automatizado | Suite completa a cada PR |

**Cenários de teste obrigatórios:**
1. Partida completa de 80 minutos com todos os tipos de evento
2. Exclusão de try no meio da partida → recálculo correto
3. 3 cartões amarelos simultâneos para times diferentes → 3 cronômetros disciplinares paralelos
4. Substituição por HIA → timer de 12 min rodando → jogo pausa → timer médico NÃO pausa
5. Disputa de penais: 5 rodadas + empate + morte súbita
6. Exportação dos 3 formatos de PDF com dados completos
7. Importação de PDF de elenco com formatos variados
8. Edição manual do relógio em diferentes períodos
9. Penal try: verifica que não pede jogador e atribui 7 pontos
10. Fim de partida: botão no cabeçalho, com confirmação, congela tudo

## 2.7 DevOps / Infraestrutura

**Responsabilidade central:** Deploy confiável e estratégia offline-first.

**Requisitos de infraestrutura:**
- **Latência baixa:** O app é usado ao vivo. Qualquer delay > 200ms é perceptível.
- **Resiliência offline:** Estádios de rugby frequentemente têm internet instável. O app DEVE funcionar offline e sincronizar quando reconectar.
- **Deploy simples:** A equipe é pequena. O deploy não pode ser um processo complexo.

**Entregas:**
- Pipeline CI/CD (GitHub Actions)
- Hospedagem com CDN (Vercel/Cloudflare Pages para front, Railway/Fly.io para back)
- Service Worker para offline-first
- Estratégia de sincronização de dados (conflict resolution)
- Monitoramento de erros (Sentry)
- Backup automático de dados de partida

## 2.8 Integrações

**Responsabilidade central:** Preparar o sistema para integração futura sem bloquear o MVP.

**Estratégia:** Não implementar integração no MVP, mas arquitetar para ela.

**O que fazer agora (MVP):**
- Definir contratos de API que permitam importar: campeonato, equipes, logos, partidas, agenda, resultados
- Modelar entidades `Competition`, `Team`, `Season` mesmo que preenchidas manualmente no MVP
- Usar UUIDs como identificadores (facilita sincronização futura)
- Documentar endpoints com OpenAPI/Swagger

**O que fazer depois (pós-MVP):**
- Adaptadores para plataformas específicas de competição
- Webhook para envio automático de resultado ao fim da partida
- Importação de escalação via API (substituindo importação de PDF)

---

# 3. FORMA DE TRABALHO DA EQUIPE

## 3.1 Fluxo de Definição → Implementação → Validação

```
                    ┌──────────────────────────┐
                    │  ESPECIALISTA EM RUGBY    │
                    │  Define as regras reais   │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │  PRODUCT OWNER            │
                    │  Traduz regras em         │
                    │  requisitos + critérios   │
                    │  de aceite                │
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴───────────────┐
                    │                          │
                    ▼                          ▼
          ┌─────────────────┐      ┌─────────────────┐
          │  UI/UX          │      │  ARQUITETO       │
          │  Transforma     │      │  Define modelo   │
          │  requisitos em  │      │  de dados e      │
          │  interface      │      │  estrutura       │
          └────────┬────────┘      └────────┬────────┘
                   │                        │
                   ▼                        ▼
          ┌─────────────────┐      ┌─────────────────┐
          │  FRONT-END      │      │  BACK-END + DBA  │
          │  Implementa     │      │  Implementa      │
          │  interface e    │      │  API, dados e    │
          │  lógica de      │      │  exportação      │
          │  estado         │      │                  │
          └────────┬────────┘      └────────┬────────┘
                   │                        │
                   └──────────┬─────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  QA                  │
                   │  Valida contra       │
                   │  critérios de aceite │
                   │  e regras do rugby   │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  PO + ESPECIALISTA  │
                   │  Homologação final  │
                   └─────────────────────┘
```

## 3.2 Quem faz o quê

| Pergunta | Resposta |
|----------|----------|
| Quem define as regras? | Especialista em Rugby, validado pelo PO |
| Quem transforma regras em interface? | UI/UX Designer, com revisão do PO |
| Quem transforma interface em código? | Front-end Developer, seguindo protótipos aprovados |
| Quem valida consistência dos dados? | DBA + Back-end + QA |
| Quem aprova a entrega? | PO, com checklist de critérios de aceite |
| Quem garante que não quebrou nada? | QA + CI automatizado |

## 3.3 Cadência de Trabalho

- **Sprints de 1 semana** (projeto pequeno, precisa de iteração rápida)
- **Daily standup de 15 min** (async se equipe for remota)
- **Review ao fim de cada sprint** com demo para PO
- **Retrospectiva a cada 2 sprints**
- **Backlog grooming** antes de cada sprint com PO + Especialista Rugby

---

# 4. ENTREGÁVEIS POR FASE

## Fase 1: Descoberta e Definição (2 semanas)

| Item | Detalhe |
|------|---------|
| **Participantes** | PO, Especialista Rugby, UI/UX, Arquiteto |
| **Entrega** | Documento de regras operacionais, user stories priorizadas, fluxogramas de cenários complexos, wireframes de baixa fidelidade |
| **Critério de aceite** | PO e Especialista validam que TODAS as regras estão documentadas. Wireframes cobrem os 10 módulos funcionais. |

## Fase 2: Arquitetura e Modelagem (1 semana)

| Item | Detalhe |
|------|---------|
| **Participantes** | Arquiteto, Back-end, DBA, Front-end |
| **Entrega** | Diagrama de arquitetura, modelo ER, definição de stack, contratos de API (OpenAPI), estrutura de projeto |
| **Critério de aceite** | Modelo de dados suporta todos os cenários documentados na Fase 1. API cobre todos os CRUDs necessários. Equipe concorda com stack. |

## Fase 3: Prototipação de UI (1-2 semanas, paralela com Fase 2)

| Item | Detalhe |
|------|---------|
| **Participantes** | UI/UX, PO, Especialista Rugby |
| **Entrega** | Protótipo de alta fidelidade navegável, design system operacional, mapa de fluxos |
| **Critério de aceite** | PO simula operação de partida completa no protótipo. Todos os fluxos principais são navegáveis. Feedback do operador real (se possível). |

## Fase 4: Desenvolvimento MVP (6-8 semanas)

**Sprint 1-2: Fundação**
| Item | Detalhe |
|------|---------|
| **Participantes** | Front-end, Back-end, DevOps |
| **Entrega** | Setup do projeto, CI/CD, autenticação, layout principal, componente de relógio, modelo de dados no banco |
| **Critério de aceite** | Relógio funciona com play/pause/reset. Layout responsivo. Pipeline de deploy funcional. |

**Sprint 3-4: Core operacional**
| Item | Detalhe |
|------|---------|
| **Participantes** | Front-end, Back-end, QA |
| **Entrega** | Pontuação (todos os tipos), cartões (com cronômetros disciplinares), timeline de eventos (CRUD + recálculo) |
| **Critério de aceite** | Registrar try → placar atualiza. Cartão amarelo → cronômetro de 10 min inicia e pausa com jogo. Excluir evento → placar recalcula. |

**Sprint 5-6: Funcionalidades complementares**
| Item | Detalhe |
|------|---------|
| **Participantes** | Front-end, Back-end, QA |
| **Entrega** | Substituições (todos os tipos), relógios médicos, elenco/súmula, importação de PDF |
| **Critério de aceite** | Substituição gera 2 linhas na timeline. Relógio médico NÃO pausa com o jogo. PDF de elenco é importado corretamente. |

**Sprint 7-8: Penais e exportação**
| Item | Detalhe |
|------|---------|
| **Participantes** | Front-end, Back-end, QA |
| **Entrega** | Disputa de penais/drops, exportação de PDF (3 formatos), fim de partida, prorrogação |
| **Critério de aceite** | Penais: melhor de 5 + morte súbita funciona. PDFs exportam corretamente nos 3 formatos. Prorrogação inicia relógio em 00:00. |

## Fase 5: Testes e Homologação (2 semanas)

| Item | Detalhe |
|------|---------|
| **Participantes** | QA, PO, Especialista Rugby, toda a equipe |
| **Entrega** | Suite de testes completa, relatório de bugs, correções, homologação com partida simulada |
| **Critério de aceite** | Zero bugs críticos. Partida completa simulada sem problemas. PO e Especialista aprovam. |

## Fase 6: Implantação (1 semana)

| Item | Detalhe |
|------|---------|
| **Participantes** | DevOps, Back-end, Front-end |
| **Entrega** | Ambiente de produção, monitoramento, documentação de operação, backup configurado |
| **Critério de aceite** | App acessível em produção. Sentry configurado. Backup automático funcionando. |

## Fase 7: Piloto e Evolução (contínuo)

| Item | Detalhe |
|------|---------|
| **Participantes** | Toda a equipe |
| **Entrega** | Uso em partida real, feedback, correções, início da integração com plataformas |
| **Critério de aceite** | App usado com sucesso em pelo menos 3 partidas reais. Feedback coletado e priorizado. |

**Timeline total estimada: 14-17 semanas do início ao piloto.**

---

# 5. ESTRUTURA FUNCIONAL — DIVISÃO EM MÓDULOS

```
cestaria/
├── src/
│   ├── modules/
│   │   ├── match-control/          # Módulo 1: Controle de Jogo
│   │   │   ├── components/         # Relógio, controles de período, play/pause
│   │   │   ├── hooks/              # useGameClock, useMatchStatus
│   │   │   ├── store/              # Estado do jogo (período, tempo, status)
│   │   │   └── logic/              # Regras de transição de período
│   │   │
│   │   ├── scoring/                # Módulo 2: Pontuação
│   │   │   ├── components/         # Painel de placar, botões de pontuação
│   │   │   ├── store/              # Estado do placar (derivado de eventos)
│   │   │   └── logic/              # Tabela de pontos, regras de penal try
│   │   │
│   │   ├── cards/                  # Módulo 3: Cartões
│   │   │   ├── components/         # Modal de cartão, relógios disciplinares
│   │   │   ├── store/              # Cartões ativos, relógios disciplinares
│   │   │   └── logic/              # Lei 9, tipos de cartão, duração
│   │   │
│   │   ├── substitutions/          # Módulo 4: Substituições
│   │   │   ├── components/         # Modal de substituição, seleção de jogador
│   │   │   ├── store/              # Substituições realizadas
│   │   │   └── logic/              # Tipos, validação, elenco ativo
│   │   │
│   │   ├── medical/                # Módulo 5: Relógios Médicos
│   │   │   ├── components/         # Relógios médicos, indicadores
│   │   │   ├── store/              # Timers médicos ativos
│   │   │   └── logic/              # Durações por tipo, tempo real
│   │   │
│   │   ├── roster/                 # Módulo 6: Súmula e Elenco
│   │   │   ├── components/         # Lista de jogadores, importação
│   │   │   ├── store/              # Elenco da partida
│   │   │   └── logic/              # Parser de PDF, validação
│   │   │
│   │   ├── timeline/               # Módulo 7: Timeline
│   │   │   ├── components/         # Lista de eventos, edição, exclusão
│   │   │   ├── store/              # Eventos da partida
│   │   │   └── logic/              # Ordenação, recálculo
│   │   │
│   │   ├── shootout/               # Módulo 8: Penais/Drops
│   │   │   ├── components/         # Interface de disputa
│   │   │   ├── store/              # Estado da disputa
│   │   │   └── logic/              # Melhor de 5, morte súbita
│   │   │
│   │   └── export/                 # Módulo 9: Exportação
│   │       ├── components/         # Botões de exportação
│   │       └── logic/              # Geração de PDF (3 formatos)
│   │
│   ├── shared/                     # Compartilhado
│   │   ├── components/             # Botões, modais, inputs, timers
│   │   ├── hooks/                  # useTimer, useConfirmation
│   │   ├── types/                  # Types globais (Match, Event, Player)
│   │   ├── utils/                  # Formatação de tempo, cálculos
│   │   └── constants/              # Pontuações, durações, tipos
│   │
│   ├── api/                        # Camada de comunicação com back-end
│   ├── store/                      # Store global (composto dos módulos)
│   └── app/                        # Layout principal, rotas
│
├── server/                         # Back-end
│   ├── routes/                     # Endpoints da API
│   ├── services/                   # Lógica de negócio
│   ├── repositories/               # Acesso a dados
│   ├── models/                     # Definição de entidades
│   ├── pdf/                        # Geração de PDF
│   ├── import/                     # Importação de PDF
│   └── audit/                      # Sistema de auditoria
│
└── database/
    ├── migrations/                 # Migrações do banco
    └── seeds/                      # Dados de teste
```

**Princípio: cada módulo é autocontido com seus componentes, estado e lógica de negócio. A comunicação entre módulos acontece via store global e eventos.**

---

# 6. RISCOS E PONTOS CRÍTICOS

## 6.1 Regras do Rugby

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Regras mudam entre temporadas (ex: vermelho temporário é experimental) | Features podem ficar obsoletas | Configuração de regras por competição, não hardcoded |
| Competições locais podem ter regras diferentes (duração de tempo, número de substituições) | App inflexível = inutilizável em certos contextos | Parâmetros configuráveis por partida/competição |
| Penal try tem regras específicas que são frequentemente mal implementadas | Dados inconsistentes | Documentar e testar explicitamente |

## 6.2 Timers — Tempo de Jogo vs. Tempo Real

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Confusão entre os dois tipos de timer** é o risco #1 do projeto | Cartão amarelo que não pausa = 10 min reais em vez de 10 min de jogo. Relógio médico que pausa = jogador ganha tempo extra indevido | Abstração clara: `GameTimeTimer` vs `RealTimeTimer`. Testes unitários extensivos. |
| Drift de cronômetro em sessões longas | Relógio impreciso após 80+ minutos | `requestAnimationFrame` com `performance.now()` e correção de drift |
| Múltiplos timers simultâneos (relógio + 3 disciplinares + 2 médicos) | Performance, confusão visual | Benchmark de 10 timers simultâneos. UI clara com agrupamento. |
| Navegador minimizado ou tab em background | `setInterval` é throttled em background tabs | Service Worker para manter timers, ou salvar estado e recalcular ao focar |

## 6.3 UX Operacional

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Operador clica no botão errado sob pressão | Evento incorreto registrado, placar errado | Ações aditivas sem confirmação MAS com undo visível (toast com "Desfazer" por 5s) |
| Tela poluída com muita informação | Operador perde referência visual | Hierarquia visual rigorosa, informação secundária colapsável |
| Operador não percebe em qual período está | Registra evento no período errado | Indicador de período sempre visível, com cor diferenciada |
| Operador precisa corrigir evento passado | Fluxo de edição complexo quebra ritmo | Edição inline na timeline, com validação imediata |

## 6.4 Consistência de Dados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Placar diverge da soma de eventos | Dados oficiais incorretos | Placar SEMPRE derivado. Nunca campo armazenado independente. |
| Edição de evento não recalcula corretamente | Placar errado | Função de recálculo com testes para todos os cenários |
| Exclusão de substituição não reverte elenco ativo | Jogador aparece como ativo e inativo | Cascade logic: excluir substituição → reverter estado do elenco |
| Dois operadores editando a mesma partida | Conflito de dados | MVP: lock por partida (1 operador por vez). Futuro: CRDT ou OT |

## 6.5 Exportação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| PDF com layout quebrado em muitos eventos | Documento ilegível | Paginação automática, teste com partida de 50+ eventos |
| Dados faltantes no PDF | Relatório incompleto | Validação pré-exportação: avisar se elenco incompleto |
| Performance de geração de PDF no servidor | Timeout em partidas longas | Geração assíncrona com notificação quando pronto |

## 6.6 Integração Futura

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| API da plataforma de competição muda | Integração quebra | Adapter pattern: camada de abstração entre o app e APIs externas |
| Formato de dados externo não é compatível | Perda de informação na importação | Mapeamento explícito com validação e log de campos ignorados |
| IDs diferentes entre sistemas | Duplicação ou perda de referência | UUIDs internos + tabela de mapeamento de IDs externos |

## 6.7 Offline / Sincronização

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Perda de internet durante partida ao vivo | Dados não salvos no servidor | Service Worker + IndexedDB: tudo local-first, sync quando online |
| Conflito ao sincronizar pós-reconexão | Dados duplicados ou perdidos | Fila de operações offline com timestamps, resolve conflitos por "last write wins" ou merge manual |
| App fecha acidentalmente (bateria, crash) | Perda de dados da partida | Auto-save a cada evento no IndexedDB. Ao reabrir, recupera estado completo. |

---

# 7. RECOMENDAÇÃO DE STACK

## 7.1 Stack Recomendada

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Front-end** | **Next.js 14+ (App Router) + React 18+** | SSR para SEO da landing page, mas o core é SPA (operação ao vivo). React é o ecossistema mais maduro para UIs complexas com estado. |
| **Linguagem** | **TypeScript** (front e back) | Type safety é crítica quando o sistema tem muitos tipos de evento, cada um com atributos diferentes. Compartilhar tipos entre front e back elimina erros. |
| **Estado (front)** | **Zustand** | Mais leve que Redux, mais simples, excelente para múltiplas stores (uma por módulo). Middleware para persistência local fácil de implementar. |
| **UI Components** | **shadcn/ui + Tailwind CSS** | Componentes acessíveis (Radix), customizáveis, sem vendor lock-in. Tailwind para prototipagem rápida com design system consistente. |
| **Back-end** | **Node.js + Fastify** (ou **tRPC** se quiser type-safe end-to-end) | Fastify é mais rápido que Express, tipado, com ecossistema maduro. tRPC elimina a camada de API contract manual se front e back são TypeScript. |
| **Banco de dados** | **PostgreSQL** | Relacional robusto, JSONB para metadata flexível (motivo de cartão, tipo de substituição), excelente para queries de agregação. |
| **ORM** | **Drizzle ORM** | Type-safe, leve, migrations integradas, SQL puro quando necessário. Mais previsível que Prisma para queries complexas. |
| **Autenticação** | **Auth.js (NextAuth v5)** ou **Clerk** | Auth.js se quiser controle total. Clerk se quiser zero-config com dashboard pronto. Para MVP, Clerk acelera. |
| **Geração de PDF** | **@react-pdf/renderer** ou **Puppeteer** | react-pdf para PDFs simples e rápidos. Puppeteer se precisar renderizar HTML complexo como PDF. |
| **Persistência offline** | **IndexedDB via Dexie.js** | Dexie é a abstração mais madura para IndexedDB, suporta queries complexas e versionamento de schema. |
| **Service Worker** | **Workbox** | Configuração de cache strategies para offline-first, integração com Next.js via next-pwa. |
| **Testes** | **Vitest + Testing Library + Playwright** | Vitest para unit/integration (rápido, compatível com Vite). Playwright para E2E (cross-browser). |
| **CI/CD** | **GitHub Actions** | Grátis para repos públicos, generoso para privados. Integração nativa com o repo. |
| **Monitoramento** | **Sentry** | Free tier generoso, captura erros com contexto, performance monitoring. |
| **Linting** | **Biome** (ou ESLint + Prettier) | Biome é mais rápido e unifica linter + formatter. ESLint se quiser ecossistema mais maduro. |

## 7.2 Hospedagem — Opções com Baixo Custo / Freemium

| Componente | Opção 1 (Menor custo) | Opção 2 (Mais robusto) |
|-----------|----------------------|----------------------|
| **Front-end** | **Vercel** (free tier: 100GB bandwidth) | **Cloudflare Pages** (free: unlimited bandwidth) |
| **Back-end** | **Railway** (free tier: $5 crédito/mês) | **Fly.io** (free tier: 3 VMs) |
| **Banco de dados** | **Supabase** (free: 500MB, 50K rows) | **Neon** (free: 512MB, branching) |
| **Armazenamento (logos, PDFs)** | **Cloudflare R2** (free: 10GB + 10M ops) | **Supabase Storage** (free: 1GB) |

**Custo estimado para MVP:** R$ 0 a R$ 50/mês (free tiers cobrem o uso inicial)

**Custo em produção real (100+ partidas/mês):** R$ 100-300/mês

## 7.3 Estratégia de Deploy

```
main branch ──► build automático ──► deploy para staging
                                          │
                                     QA + PO validam
                                          │
                                   tag release ──► deploy para produção
```

- **Feature branches** para cada story/módulo
- **PR review obrigatório** (mínimo 1 aprovação)
- **CI roda em cada PR:** lint + typecheck + testes
- **Deploy automático para staging** em merge para main
- **Deploy para produção** via tag de release (manual, com checklist)
- **Rollback:** Vercel/Cloudflare mantém deploys anteriores, rollback em 1 clique

## 7.4 Alternativa Simplificada (Solo Developer / Time de 2)

Se a equipe for muito pequena, considere:

| Camada | Alternativa | Tradeoff |
|--------|------------|----------|
| Full-stack | **Next.js + Server Actions + Drizzle + PostgreSQL** | Tudo em um único projeto Next.js. Menos separação, mais velocidade. |
| Banco | **SQLite via Turso** | Mais simples, edge-ready, mas menos poder que PostgreSQL. |
| Hospedagem | **Vercel (tudo)** | Front + API + DB (via Vercel Postgres). Um provider, zero DevOps. |
| Auth | **Clerk** | Zero config, pronto em 30 min. |

---

# 8. RESUMO EXECUTIVO

## O que é o Cestária?
Mesa de controle de rugby para operação ao vivo — registra placar, eventos, cronômetros, súmula e exporta relatórios.

## Equipe mínima?
4 pessoas dedicadas + 1 parcial.

## Quanto tempo?
14-17 semanas da concepção ao piloto.

## Quanto custa?
Infra: R$ 0-50/mês no MVP. O maior custo é o tempo da equipe.

## Qual é o maior risco?
A dualidade de cronômetros (tempo de jogo vs. tempo real). Se a abstração não for feita corretamente no início, contamina todo o sistema.

## Por onde começar?
1. Documentar TODAS as regras operacionais do rugby com o especialista
2. Validar wireframes com operador real
3. Só então escrever código

---

*Documento gerado em 15/03/2026 como entrega da fase de planejamento de equipe do projeto Cestária.*
