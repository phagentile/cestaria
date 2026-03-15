# Cestária — Regras de Negócio do Rugby

## Documento de Referência para Desenvolvimento

> Este documento é a fonte de verdade para toda lógica de negócio implementada no sistema.
> Qualquer dúvida entre o que o código faz e o que este documento diz, **o documento prevalece**.

---

# 1. TIPOS DE JOGO

## 1.1 Rugby XV

| Parâmetro | Valor |
|-----------|-------|
| Jogadores em campo | 15 |
| Reservas | 8 |
| Substituições máximas | 8 |
| 1º Tempo | 40 min (00:00 → 40:00) |
| 2º Tempo | 40 min (40:00 → 80:00) |
| Intervalo | 10 min |
| Prorrogação | 2x 10 min (00:00 →) |
| Cartão amarelo | 10 min de tempo de jogo |
| Cartão vermelho temporário | 20 min de tempo de jogo |
| Conversão | Chute ao gol |
| Tempo para conversão | 90 segundos |

## 1.2 Rugby Sevens

| Parâmetro | Valor |
|-----------|-------|
| Jogadores em campo | 7 |
| Reservas | 5 |
| Substituições máximas | 5 |
| 1º Tempo | 7 min (00:00 → 07:00) |
| 2º Tempo | 7 min (07:00 → 14:00) |
| Final de torneio | 2x 10 min |
| Intervalo | 2 min |
| Prorrogação | 2x 5 min (00:00 →) |
| Cartão amarelo | 2 min de tempo de jogo |
| Cartão vermelho temporário | Segue regulamento da competição |
| Conversão | Drop kick obrigatório |
| Tempo para conversão | 30-40 segundos |

> **REGRA:** O sistema DEVE ser parametrizável. Os valores acima devem estar em `GameType.config`, NÃO hardcoded.

---

# 2. PERÍODOS DO JOGO

## 2.1 Fluxo de Períodos (XV)

```
SCHEDULED → 1º TEMPO (00:00→40:00) → INTERVALO → 2º TEMPO (40:00→80:00)
                                                          │
                                                    Se empate e
                                                    regulamento exige:
                                                          │
                                                          ▼
                                              PRORROGAÇÃO 1 (00:00→10:00)
                                                          │
                                                          ▼
                                              PRORROGAÇÃO 2 (10:00→20:00)
                                                          │
                                                    Se ainda empate:
                                                          │
                                                          ▼
                                              DISPUTA DE PENAIS/DROPS
                                                          │
                                                          ▼
                                                      FINISHED
```

## 2.2 Regras do Relógio

| Regra | Detalhe |
|-------|---------|
| Início do 1T | 00:00 |
| Início do 2T | 40:00 (XV) / 07:00 (Sevens) |
| Início da prorrogação | 00:00 |
| Play/Pause | Operador controla. Pausa congela TODOS os cronômetros disciplinares. NÃO congela médicos. |
| Reset | Com confirmação obrigatória. Volta ao início do período atual. |
| Edição manual | Operador pode alterar minutos e segundos. Com registro em auditoria. |
| Fim de partida | Botão no cabeçalho. Com confirmação. Congela tudo. |
| Direção | Crescente (00:00 → 40:00). Pode ultrapassar o tempo regulamentar (acréscimos). |

---

# 3. PONTUAÇÃO

## 3.1 Tabela de Pontos

| Tipo | Pontos | Requer Jogador | Requer Time | Habilita Conversão |
|------|--------|---------------|-------------|-------------------|
| Try | 5 | SIM | SIM | SIM |
| Conversão (convertida) | 2 | SIM | SIM | — |
| Conversão (perdida) | 0 | SIM | SIM | — |
| Penal (convertido) | 3 | SIM | SIM | NÃO |
| Penal (perdido) | 0 | SIM | SIM | NÃO |
| Drop (convertido) | 3 | SIM | SIM | NÃO |
| Drop (perdido) | 0 | SIM | SIM | NÃO |
| Penal Try | 7 | NÃO (número 00) | SIM | NÃO (automático) |

## 3.2 Regras Especiais

### Penal Try
- Concedido pelo árbitro quando uma infração impediu um try certo
- **NÃO seleciona jogador** — atribuído ao número 00
- **NÃO habilita conversão** — os 7 pontos são automáticos (5 try + 2 conversão implícita)
- Na timeline: exibir como "Penal Try" com valor 7

### Conversão após Try
- Somente habilitada imediatamente após um try do MESMO time
- Se o try for excluído, a conversão vinculada também deve ser excluída (ou alertar)
- No Sevens, conversão é obrigatoriamente por drop kick

### Cálculo do Placar
- **REGRA ABSOLUTA:** O placar é SEMPRE a soma de `points` de todos os `MatchEvent` ativos (não excluídos) de cada time.
- **NUNCA** armazenar placar como campo independente.
- Excluir qualquer evento de pontuação = recalcular placar automaticamente.
- Editar um evento (ex: trocar de time) = recalcular placar automaticamente.

---

# 4. CARTÕES

## 4.1 Tipos

| Tipo | Cor | Duração | Timer Pausa com Jogo? | Jogador Retorna? |
|------|-----|---------|----------------------|-----------------|
| Amarelo | Amarelo | 10 min XV / 2 min Sevens (tempo de jogo) | SIM | SIM, após expirar |
| Vermelho Definitivo | Vermelho | Permanente | N/A | NÃO |
| Vermelho Temporário | Vermelho com borda | 20 min (tempo de jogo) | SIM | SIM, após expirar |

## 4.2 Campos Obrigatórios

| Campo | Obrigatório | Detalhe |
|-------|------------|---------|
| Time | SIM | Qual time o atleta/staff pertence |
| Atleta ou Staff | SIM | A quem o cartão é aplicado |
| Tipo de cartão | SIM | Amarelo, vermelho, vermelho temporário |
| Motivo (Lei 9) | SIM | Seleção do motivo conforme Lei 9 do World Rugby |
| Descrição breve | NÃO (opcional) | Texto livre para detalhar a infração |
| Minuto | AUTOMÁTICO | Capturado do relógio no momento do registro |

## 4.3 Lei 9 — Motivos de Cartão

Categorias principais de infração (World Rugby Laws):
- Jogo desleal (foul play)
- Jogo perigoso (dangerous play)
- Conduta antidesportiva (unsporting conduct)
- Ofensas repetidas (repeated offences)
- Obstrução intencional (intentional offside)
- Tackle perigoso (dangerous tackle)
- Jogo sujo (striking, stamping, kicking)
- Conflito (fighting)
- Linguagem abusiva (verbal abuse)
- Ação contrária ao espírito do jogo

> O sistema deve oferecer uma lista selecionável desses motivos, com opção de texto livre para detalhamento.

## 4.4 Cartão para Staff

- Membros da comissão técnica podem receber cartões
- Mesmo fluxo do cartão de atleta, mas selecionando de `MatchRoster` com `role: staff`
- Staff com vermelho deve se retirar da área técnica
- NÃO gera cronômetro disciplinar (staff não é jogador em campo)

## 4.5 Relógios Disciplinares

### Comportamento
- Iniciam no momento do registro do cartão
- **PAUSAM quando o relógio do jogo pausa** (tempo de jogo, não tempo real)
- Contam de forma decrescente: 10:00 → 00:00 (XV amarelo)
- Ao expirar: notificação visual ao operador, jogador pode retornar
- Exibem o número do atleta punido

### Múltiplos Simultâneos
- Podem existir até N cronômetros disciplinares simultâneos (ex: 2 amarelos + 1 vermelho temporário)
- Cada um é independente, mas todos pausam quando o jogo pausa
- UI deve agrupar por time para clareza visual

### Cálculo do Tempo Acumulado
```
elapsed_game_seconds += delta_seconds  // apenas quando clock_running = true
remaining = duration_seconds - elapsed_game_seconds
if remaining <= 0: status = 'expired'
```

---

# 5. SUBSTITUIÇÕES

## 5.1 Tipos de Substituição

| Tipo | Temporária? | Gera Relógio Médico? | Observação |
|------|------------|---------------------|-----------|
| Tática | NÃO | NÃO | Substituição definitiva |
| Lesão | NÃO | NÃO | Substituição definitiva por lesão |
| Sangue | SIM | SIM (15 min real) | Jogador pode retornar |
| HIA | SIM | SIM (12 min real) | Head Injury Assessment. Pode virar definitiva. |
| Sangue + HIA | SIM | SIM (17 min real) | Combina ambas as situações |
| Front Row | NÃO | NÃO | Específica para pilares/hooker. Pode tornar scrums não-contestados. |
| Temporária | SIM | NÃO | Substituição temporária genérica |

## 5.2 Fluxo de Substituição

```
Operador seleciona "Substituição"
         │
         ▼
┌─────────────────────────┐
│ Selecionar TIME         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Selecionar quem SAI     │
│ (lista de ativos)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Selecionar quem ENTRA   │
│ (lista de reservas)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Selecionar TIPO         │
│ (tática, lesão, etc.)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ SISTEMA GERA:           │
│ - Evento "Saída" na     │
│   timeline              │
│ - Evento "Entrada" na   │
│   timeline              │
│ - Atualiza elenco ativo │
│ - Se sangue/HIA: inicia │
│   relógio médico        │
└─────────────────────────┘
```

## 5.3 Fluxo SEPARADO de Cartão

**IMPORTANTE:** Substituição é um fluxo SEPARADO do cartão. Cartão e substituição são eventos independentes.
- Um cartão vermelho NÃO gera automaticamente uma substituição.
- O operador registra o cartão e, se necessário, registra a substituição separadamente.

---

# 6. RELÓGIOS MÉDICOS

## 6.1 Tipos e Durações

| Tipo | Duração | Tipo de Tempo | Pausa com Jogo? |
|------|---------|--------------|----------------|
| Sangue | 15 min | TEMPO REAL | NÃO |
| HIA | 12 min | TEMPO REAL | NÃO |
| Sangue + HIA | 17 min | TEMPO REAL | NÃO |

## 6.2 Comportamento

- Iniciam no momento do registro da substituição médica
- **NÃO pausam quando o relógio do jogo pausa** (são tempo real cronológico)
- Baseados em `started_at` (timestamp) + duração
- `remaining = duration - (now - started_at)`
- Ao expirar: notificação visual ao operador
- Se o jogador não retornou ao expirar, substituição se torna definitiva

## 6.3 Diferença Fundamental

```
DISCIPLINAR (cartão):     tempo de JOGO    → pausa com jogo
MÉDICO (substituição):    tempo REAL        → NÃO pausa com jogo
```

> Esta é a regra mais crítica do sistema. Confundir os dois tipos de timer invalida toda a operação.

---

# 7. DISPUTA DE PENAIS / DROPS

## 7.1 Formato

1. **Fase normal:** Melhor de 5 (cada time chuta 5 vezes, alternadamente)
2. **Se empate após 5:** Morte súbita (cada time chuta 1 vez por rodada até haver vencedor)

## 7.2 Registro por Tentativa

| Campo | Valor |
|-------|-------|
| Rodada | 1-5 (normal) ou 6+ (morte súbita) |
| Time | Qual time está chutando |
| Jogador | Quem chutou (opcional se não identificado) |
| Resultado | Convertido / Perdido |

## 7.3 Exibição

- Interface clicável por tentativa (botões para cada chute)
- Resultado exibido ao lado do placar entre parênteses: `21-21 (3-2)`
- Indicador visual de quem está vencendo durante a disputa
- Indicador de morte súbita quando aplicável

## 7.4 Pontuação de Penais

- Penais da disputa **NÃO** somam ao placar principal
- O placar entre parênteses é independente
- Servem apenas para determinar o vencedor em caso de empate no tempo regulamentar/prorrogação

---

# 8. TIMELINE DE EVENTOS

## 8.1 Formato da Linha

```
[MINUTO:SEGUNDO] | [TIME] | [TIPO DE EVENTO] - [JOGADOR] | [PLACAR A] - [PLACAR B]
```

Exemplo:
```
05:23 | Corinthians   | Try - #11 João Silva         | 5  - 0
06:45 | Corinthians   | Conversão - #10 Pedro Santos | 7  - 0
12:30 | São José      | Penal - #10 Carlos Lima      | 7  - 3
23:15 | Corinthians   | Cartão Amarelo - #6 Rafael   | 7  - 3
40:00 | —             | Fim do 1º Tempo              | 7  - 3
45:30 | São José      | Substituição: #8 sai, #20 entra (tática) | 7  - 3
```

## 8.2 Operações na Timeline

| Operação | Confirmação | Efeito Colateral |
|----------|------------|-----------------|
| Editar evento | NÃO | Recalcular placar se evento de pontuação |
| Excluir evento | SIM | Recalcular placar. Se substituição: reverter elenco ativo. Se cartão: cancelar cronômetro disciplinar. |
| Reverter evento | SIM | Mesmo que excluir, mas mantém registro visual de "revertido" |

## 8.3 Substituição na Timeline

Uma substituição gera **DUAS linhas**:
```
50:00 | Corinthians | Saída - #8 Rafael (tática)     | 7 - 3
50:00 | Corinthians | Entrada - #20 Marcos (tática)   | 7 - 3
```

---

# 9. ENCERRAMENTO E REABERTURA

## 9.1 Encerramento

- Botão "Encerrar Partida" no cabeçalho
- Confirmação obrigatória
- **Ao encerrar:**
  - Todos os relógios param
  - Timeline fica somente leitura
  - Nenhum evento pode ser adicionado, editado ou excluído
  - Botões de ação ficam desabilitados
  - Exportação fica disponível (se critérios atendidos)
  - Log de auditoria: quem encerrou, quando

## 9.2 Reabertura

- Disponível para Gestor e Quarto Árbitro
- Confirmação obrigatória
- **Ao reabrir:**
  - Partida volta ao estado operacional
  - Todos os controles são desbloqueados
  - Log de auditoria: quem reabriu, quando, que estava encerrada desde [data]

## 9.3 Critérios para Exportação Oficial

1. Partida atingiu tempo regulamentar (80 min XV / 14 min Sevens)
2. Hora de início registrada
3. Hora de fim registrada

Se critérios não atendidos: **aviso** mas **permite exportar** (jogo abandonado, etc.)

---

# 10. CADASTROS MESTRES

Gerenciados exclusivamente pelo Gestor, na aba de cadastro.

| Entidade | Campos | Vínculos |
|----------|--------|----------|
| **Confederação** | Nome, sigla, país, logo | — |
| **Federação** | Nome, sigla, região, logo | → Confederação |
| **Clube** | Nome, sigla, cidade, logo, cores | → Federação |
| **Árbitro** | Nome, função habitual, foto (opcional) | → Federação |
| **Categoria** | Nome (adulto, juvenil, M19, M21, feminino, etc.) | — |
| **Tipo de Jogo** | Nome (XV, Sevens), configuração (JSON com todos os parâmetros) | — |

---

# 11. SÚMULA

## 11.1 Dados Obrigatórios

**Dados da Partida:**
- Data, hora de início, hora de fim
- Local (estádio/campo)
- Competição, categoria, tipo de jogo
- Resultado final (placar + penais se aplicável)

**Dados dos Clubes (ambos):**
- Nome, escudo, cores

**Dados dos Atletas (ambos os times):**
- Número, nome, posição
- Titular ou reserva
- Eventos: pontuação, cartões, substituições

**Comissão Técnica (ambos os times):**
- Cargo, nome
- Cartões (se recebidos)

**Dados dos Árbitros:**
- Nome, função na partida (central, AR1, AR2, TMO, 4º árbitro)

---

*Documento de regras de negócio — v1.0 — 15/03/2026*
*Fonte: World Rugby Laws of the Game + definições do stakeholder*
