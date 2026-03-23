# Cestaria - Documento de Melhorias (Lógica + UI/UX)

## Baseado na Análise Comparativa: RegiSLAR vs Cestaria

> Documento para uso como prompt de implementação.
> Gerado a partir da análise do sistema RegiSLAR (produção, Super Rugby Americas 2026)
> e da base de código atual do Cestaria.

---

## PARTE 1: MELHORIAS DE UI/UX

### 1.1 Design System e Paleta de Cores

**Problema atual:** O Cestaria usa tema escuro genérico sem identidade visual forte.

**Referencia RegiSLAR:**
- Fundo principal: azul-gris oscuro (`#1F2937`, `#2C3E50`, `#354558`)
- Acento primario: Rojo (`#DC3545`) para acoes criticas e badges de status
- Acento secundario: Dorado (`#FFC107`) para edicao e pontuacao
- Azul (`#007BFF`) para informacao e botoes secundarios
- Verde (`#28A745`) para sucesso e confirmacao
- Texto: branco sobre fundo escuro, com cinza claro (`#CBD5E1`) para labels

**Melhoria proposta:**
- Definir tokens de design (CSS variables) com a paleta acima
- Cards de acao (Formacoes, Incidencias, etc.) com cores distintas por funcao:
  - Purpura para "Alterar Status"
  - Verde para "Formacoes"
  - Dorado para "Incidencias"
  - Azul para "Imprimir/Exportar"
- Gradient backgrounds nos paineis (`linear-gradient(135deg, ...)`)
- Bordas sutis com `rgba(255,255,255,0.1)` para separacao visual

### 1.2 Layout da Pagina de Detalhe da Partida

**Problema atual:** A pagina `match/[id]` tem layout funcional mas nao segue padrao de sistemas profissionais de rugby.

**Referencia RegiSLAR - Estrutura:**
```
+-- Header com breadcrumb (Partidos > PARTIDO #XX) --+
|                                                      |
|  [Icone] PARTIDO #XX        [Badge Status] [Editar] |
|  Competicao - Rodada                                |
|                                                      |
+-- Grid 2 colunas -----------------------------------+
|  Info da Partida          |  Oficiais               |
|  Data: DD/MM/YYYY         |  Arbitro: Nome          |
|  Hora: HH:MM              |  Ajudante 1: Nome       |
|  Local: Estadio           |  TMO: Por designar      |
+---------------------------+-------------------------+
|                                                      |
|  [Logo A] Time A   19 - 49   Time B [Logo B]        |
|           LOCAL   (3T - 7T)   VISITANTE              |
|                                                      |
+-- Tabs ----------------------------------------------+
|  [Formacoes] [Incidencias] [Documentos] [Disciplina] |
|                                                      |
|  Conteudo do tab ativo                               |
|                                                      |
+-- Cards de Acao (Grid 4 colunas) --------------------+
|  Alterar   | Formacoes | Incidencias | Imprimir     |
|  Status    | Gestionar | Gestionar   | Exportar     |
+------------------------------------------------------+
```

**Melhorias propostas:**
1. **Header da partida** com icone, titulo grande, badge de status pill-shaped, botao de edicao
2. **Grid 2 colunas** para info basica + oficiais lado a lado
3. **Marcador central** em destaque com logos, nomes, posicao (LOCAL/VISITANTE) e placar grande
4. **Sistema de tabs** para separar Formacoes, Timeline (Incidencias), Documentos, Disciplina
5. **Cards de acao** coloridos em grid 4 colunas no rodape

### 1.3 Oficiais da Partida (NOVO)

**Problema atual:** O Cestaria registra arbitros na aba Roster mas nao tem visualizacao dedicada de oficiais.

**Referencia RegiSLAR - Lista completa de oficiais:**
| Funcao | Campo |
|--------|-------|
| Arbitro | Nome |
| Ajudante 1 | Nome |
| Ajudante 2 | Nome |
| TMO | Nome ou "Por designar" |
| Oficial Judicial | Nome |
| Oficial de Citacao | Nome |
| Oficial de Apelacoes | Nome |
| Match Commissioner | Nome |
| Planillero | Nome |
| Medico | Nome |

**Melhoria proposta:**
- Adicionar secao "Oficiais" na pagina de detalhes da partida
- Grid 2 colunas mostrando funcao + nome
- Estado "Por designar" em cinza/italico para posicoes vazias
- Expandir tipos de arbitros no modelo: `match_referees` deve suportar: central, ar1, ar2, tmo, fourth_official, judicial_officer, citing_officer, appeals_officer, match_commissioner, scorer, doctor

### 1.4 Timeline (Incidencias) - Visual

**Problema atual:** A timeline e uma lista simples. RegiSLAR usa uma timeline visual mais rica.

**Referencia RegiSLAR:**
```
  O  Try           +5     <- circulo azul com icone
  |  11 Ignacio Diaz       <- numero da camisa + nome
  |
  O  Conversao     +2     <- circulo verde com check
  |  10 Bauti Farise
  |
  O  Conv. fallida         <- circulo vermelho com X
  |  Julian Leszczynski
  |
24' O  <- Egresa           <- circulo cinza
  |  Valentin Vidal
  |
24' O  -> Ingresa
     Ramiro Berardi
```

**Melhorias propostas:**
1. **Eixo vertical** com linha conectora e circulos coloridos por tipo de evento
2. **Circulos com cores:**
   - Azul (`#007BFF`) para tries e conversoes
   - Verde (`#28A745`) para conversao convertida
   - Vermelho (`#DC3545`) para conversao perdida
   - Cinza (`#6C757D`) para substituicoes
   - Amarelo (`#FFC107`) para cartao amarelo
   - Vermelho escuro para cartao vermelho
3. **Badges de pontos** (`+5`, `+2`, `+3`) em amarelo/dorado
4. **Minuto do evento** alinhado a esquerda fora do circulo
5. **Numero da camisa** em badge circular antes do nome do jogador

### 1.5 Cards de Acao no Rodape

**Problema atual:** Acoes como "Alterar Status", "Ir para Formacoes", "Ir para Incidencias", "Exportar" estao espalhadas pela interface.

**Referencia RegiSLAR - Cards coloridos em grid:**
```
[Purpura: Alterar Status]  [Verde: Formacoes]
  - Dropdown de status       - Link para gestionar
  - Botao "Atualizar"

[Dorado: Incidencias]      [Azul: Imprimir]
  - Link para gestionar      - Link para exportar PDF
```

**Melhoria proposta:**
- Criar secao "Acoes da Partida" com 4 cards em grid responsivo
- Cada card com: icone, titulo, descricao breve, botao de acao
- Cores de fundo com gradient por funcao
- Botoes com `background: rgba(255,255,255,0.2)` e hover com 0.3

### 1.6 Score Panel - Marcador Central

**Problema atual:** O score panel mostra o placar mas pode ser mais rico visualmente.

**Melhorias propostas inspiradas no RegiSLAR:**
1. Logos dos clubes em ambos os lados (se disponivel via `club.logo_url`)
2. Labels "LOCAL" (vermelho) e "VISITANTE" (azul) como badges
3. Placar em fonte grande (4rem+), tries entre parenteses abaixo
4. Fundo com gradient escuro e borda sutil
5. Nomes completos dos times (nao apenas sigla)

### 1.7 Sistema de Filtros (Dashboard)

**Problema atual:** O dashboard lista partidas sem filtros.

**Referencia RegiSLAR - Painel de filtros:**
- Input de busca por equipe ou numero
- Dropdown de Rodada (Todas, Classificacao, Final, Primeira, Segunda, Semi)
- Dropdown de Status (Todos, Programado, Confirmado, Em Curso, Finalizado)
- Dropdown de Equipe (Todos + lista de equipes)
- Botoes "Filtrar" e "Limpar"

**Melhoria proposta:**
- Adicionar painel de filtros acima da lista de partidas no dashboard
- Filtrar por: texto livre, status, clube, competicao
- Botao "Limpar filtros"

### 1.8 Tabela de Partidas (Dashboard)

**Problema atual:** Lista simples de cards.

**Referencia RegiSLAR - Tabela rica:**
| # | Data/Hora | Rodada | Encontro | Estadio | Status | Comissario | Acoes |
|---|-----------|--------|----------|---------|--------|------------|-------|
| 20 | 22/03 15:06 | 1a Rodada | [Logo] Cobras 19-49 Pampas [Logo] | Nacional | Finalizado | Lucas C. | Ver / Formacoes / Incidentes |

**Melhoria proposta:**
- Trocar cards por tabela com colunas
- Coluna "Encontro" mostrando logos + nomes + placar + tries inline
- Dropdown de acoes por partida (Ver detalhes, Formacoes, Incidentes)
- Badges de status com cores: Programado (cinza), Confirmado (azul), Em Curso (amarelo), Finalizado (vermelho)

---

## PARTE 2: MELHORIAS DE LOGICA

### 2.1 Gestao de Documentos (NOVO)

**Ausente no Cestaria, presente no RegiSLAR.**

**Referencia:**
- Tab "Documentos" na pagina da partida
- Upload de PDFs (Match Sheet, Team Sheet)
- Tabela de documentos com: tipo, nome, arquivo, acoes (abrir/eliminar)
- Limites: 15MB por arquivo, 20MB total por request
- Tipos: "Match sheet" e "Team sheet"

**Melhoria proposta:**
- Adicionar modelo `match_documents` no Dexie:
  ```
  matchDocuments: 'id, matchId, type, name, fileData'
  ```
- Tab "Documentos" na pagina da partida
- Upload de PDF com validacao de tamanho
- Para offline-first: armazenar arquivo em IndexedDB como base64/blob
- Tipos de documento: match_sheet, team_sheet, incident_report
- Exportar/abrir PDF no browser

### 2.2 Gestao Disciplinar (NOVO)

**Ausente no Cestaria, presente no RegiSLAR.**

**Referencia:**
- Tab "Disciplina" na pagina da partida
- Lista de incidencias disciplinarias
- Form "Gerar Sancao Disciplinar" com:
  - Incidencia a sancionar (dropdown)
  - Descricao (textarea obrigatorio)
  - Data fim suspensao (opcional)
  - Tipo de documento (13 opcoes: citing, audiencia, resolucao, etc.)
  - Upload de arquivo

**Melhoria proposta:**
- Adicionar modelo `disciplinary_sanctions` no Dexie:
  ```
  disciplinarySanctions: 'id, matchId, eventId, description, endDate, docType, fileData'
  ```
- Tab "Disciplina" com lista de sancoes e form para criar
- Tipos de documento disciplinar:
  - Audiencia de apelacao
  - Citing
  - Declaracao de testemunhas
  - Descargo
  - Gravacao audiencia
  - Imagens ou videos
  - Reporte de cartao amarelo
  - Reporte de cartao vermelho
  - Reporte por duplo amarelo
  - Resolucao
  - Resolucao de apelacao
  - Resumo de audiencia
  - Diversos

### 2.3 Status da Partida - Fluxo Melhorado

**Problema atual:** Status: scheduled, live, finished, reopened.

**Referencia RegiSLAR:** Programado, Confirmado, Em Curso, Finalizado.

**Melhoria proposta:**
- Adicionar status `confirmed` entre `scheduled` e `live`:
  - `scheduled` -> `confirmed` -> `live` -> `finished` -> `reopened` -> `live`
- Card dedicado "Alterar Status" com dropdown e botao "Atualizar"
- Log de auditoria em cada mudanca de status

### 2.4 Competicao e Rodada

**Problema atual:** O campo `competition_name` e texto livre. Nao ha conceito de "rodada".

**Referencia RegiSLAR:**
- Selector de Torneio no header (Super Rugby Americas 2026, 2025, etc.)
- Rodadas: Classificacao, Primeira Rodada, Segunda Rodada, Semi Final, Final
- Filtro por rodada

**Melhoria proposta:**
- Adicionar modelo `competitions` e `rounds` no Dexie:
  ```
  competitions: 'id, name, year'
  rounds: 'id, competitionId, name, order'
  ```
- Vincular partida a competicao + rodada
- Selector de competicao global no header/dashboard

### 2.5 Impressao de Planilha PDF

**Problema atual:** Exportacao em formato texto simples (`.txt`).

**Referencia RegiSLAR:** Link para `/partidos/:id/planilla-pdf` que gera PDF formatado.

**Melhoria proposta:**
- Usar `@react-pdf/renderer` (ja esta no package.json) para gerar PDFs reais
- Tres formatos (ja previstos na arquitetura):
  1. **Timeline de Eventos** - Tabela cronologica com MIN | TIME | EVENTO | PLACAR
  2. **Sumula Oficial** - Dados completos: times, jogadores, staff, arbitros, resultado
  3. **Completo** - Combinacao dos dois
- Botao "Imprimir" abrindo preview do PDF no browser
- Gerado 100% no client (offline-first)

### 2.6 Toast Notifications (Ja Existe - Melhorar)

**Referencia RegiSLAR:**
```javascript
Alpine.store('toast', {
  show: false,
  type: 'success' | 'error',
  message: string,
  open(type, message, ms = 6000) { ... },
  close() { ... }
})
```

**Melhoria proposta:**
- O Cestaria ja usa Sonner para toasts, mas nao os usa em todas as acoes
- Adicionar toasts para:
  - Registro de evento (try, conversao, cartao, substituicao)
  - Mudanca de status da partida
  - Upload/exclusao de documento
  - Erros de validacao
  - Sync com servidor (quando implementado)

### 2.7 Prevencao de Duplo-Clique

**Referencia RegiSLAR:**
```javascript
// Ao clicar em um link:
// - Reduz opacity para 0.7
// - Desativa pointer-events
// - Re-habilita apos 3 segundos
```

**Melhoria proposta:**
- Adicionar debounce/throttle em botoes de acao durante partida ao vivo
- Desabilitar botao apos clique por 500ms para evitar duplo-registro
- Feedback visual imediato (opacity reducida, loading state)

### 2.8 Animacoes de Entrada

**Referencia RegiSLAR:**
```css
/* Fade-in suave do conteudo principal */
opacity: 0 -> 1 (0.5s ease)
translateY: 10px -> 0px (0.5s ease)
```

**Melhoria proposta:**
- Adicionar transicoes suaves no carregamento de paginas/tabs
- Cards de acao com hover scale + shadow
- Timeline events com fade-in ao aparecer

### 2.9 Sidebar Responsivo

**Referencia RegiSLAR:**
- Sidebar navegacao com toggle (hamburger) em mobile
- Fecha ao clicar fora
- Comportamento responsive ao resize

**Melhoria proposta (ja parcialmente existe):**
- Melhorar a navegacao mobile com sidebar/drawer
- Links: PARTIDAS | JOGADORES | STAFF | EQUIPES (se for expandir alem da mesa de controle)
- No contexto atual, manter tabs como navegacao principal

---

## PARTE 3: CHECKLIST DE IMPLEMENTACAO

### Prioridade ALTA (Impacto visual + funcional):
- [ ] Redesign da paleta de cores com tokens CSS
- [ ] Score panel com logos, labels LOCAL/VISITANTE, tries
- [ ] Timeline visual com eixo vertical e circulos coloridos
- [ ] Gerar PDF real com @react-pdf/renderer
- [ ] Status `confirmed` no fluxo de estados
- [ ] Toasts em todas as acoes de registro de evento

### Prioridade MEDIA (Enriquecimento):
- [ ] Grid 2 colunas: Info Partida + Oficiais
- [ ] Cards de acao coloridos no rodape
- [ ] Tabela de partidas no dashboard (vs cards)
- [ ] Filtros no dashboard (status, clube, competicao)
- [ ] Badges de pontos (+5, +2, +3) na timeline
- [ ] Debounce em botoes de acao

### Prioridade BAIXA (Features novas):
- [ ] Tab "Documentos" com upload de PDF
- [ ] Tab "Disciplina" com sancoes
- [ ] Modelo de competicoes e rodadas
- [ ] Lista expandida de oficiais (judicial, citacao, apelacoes, comissario, planillero, medico)
- [ ] Animacoes de entrada (fade-in, translateY)

---

## PARTE 4: PROMPT DE IMPLEMENTACAO

Ao implementar estas melhorias, siga estas regras:

1. **Nunca hardcodar parametros de jogo** - XV vs Sevens deve ser parametrizavel via GameType.config
2. **Placar SEMPRE derivado** - Soma de eventos, nunca campo armazenado
3. **Offline-first** - Tudo funciona sem internet. PDFs gerados no browser.
4. **Usar shadcn/ui + base-ui** - Nao usar Radix. `Select.onValueChange` recebe `string | null`.
5. **Nao usar `asChild`** - Nao existe no base-ui. Usar state controlado.
6. **Fontes do sistema** - Nao usar Google Fonts (offline). Usar `font-sans`.
7. **Dexie.js para persistencia** - IndexedDB para dados e documentos.
8. **Zustand para estado** - Stores separados por modulo.
9. **Idioma PT-BR** - Interface em portugues brasileiro.
10. **Responsivo** - Funcionar em desktop e tablet (uso primario na beira do campo).

---

*Documento de melhorias - v1.0 - 21/03/2026*
*Baseado na analise do sistema RegiSLAR (Sudamerica Rugby) e da base de codigo Cestaria*
