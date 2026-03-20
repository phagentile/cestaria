# ⚡ Quick Start - Rugby Analytics Ecosystem

## 🏁 Começar em 30 Minutos

### Pré-requisitos
- Node.js 18+ instalado
- MySQL 8.0+ rodando localmente
- Git configurado
- 2GB RAM mínimo

### Passo 1: Setup do Banco de Dados (5 min)

```bash
# Conectar ao MySQL
mysql -u root -p

# Colar no MySQL Console:
CREATE DATABASE IF NOT EXISTS rugby_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rugby_control;

# Criar tabelas (copiar do backend-architecture.md ou usar arquivo schema.sql)
```

### Passo 2: Clone & Setup Backend (5 min)

```bash
# Clone (ou use seu fork)
git clone https://github.com/seu-usuario/rugby-analytics.git
cd rugby-analytics/backend

# Instale dependências
npm install

# Configure .env
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=rugby_control
JWT_SECRET=rugby-secret-2026-uuid-$(uuidgen)
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3001
NODE_ENV=development
EOF
```

### Passo 3: Start Backend (3 min)

```bash
# Inicie servidor em desenvolvimento
npm run dev

# Resultado esperado:
# 🏉 Rugby Analytics Server running on port 3001
# Endpoints:
#   POST   /api/auth/login
#   POST   /api/matches
#   GET    /api/matches/:id
#   ...
```

### Passo 4: Teste Primeiro Endpoint (5 min)

```bash
# Terminal nova janela - teste login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "referee@club.com",
    "password": "password123"
  }'

# Resultado esperado:
# {
#   "token": "eyJ0eXAiOiJKV1QiLC...",
#   "user": {
#     "id": 1,
#     "email": "referee@club.com",
#     "role": "referee"
#   }
# }
```

### Passo 5: Abra Frontends (5 min)

```bash
# Frontend 1: Análise de Rugby Pro
open frontend-referee/index.html

# Frontend 2: Rugby Analytics Platform
open frontend-analytics/index.html

# Versão Android: Abra em Android Studio
# File > Open > mobile-android/
```

### Passo 6: Teste Fluxo Completo (5 min)

```
1. Análise de Rugby Pro
   └─ Login com token do curl
   └─ Criar nova partida
   └─ Registrar alguns eventos

2. Rugby Analytics Platform
   └─ Preencher estatísticas (Time A/B)
   └─ Ver dashboard atualizar

3. Voltar para Análise de Rugby Pro
   └─ Ir para Pós-Jogo
   └─ Ver dados consolidados
   └─ Exportar PDF
```

---

## 🎯 Primeiro Fluxo Prático

### Cenário: Partida Jacareí vs Iguanas

```bash
# 1. ÁRBITRO CRIA PARTIDA
curl -X POST http://localhost:3001/api/matches \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "competition": "Super 12 2026",
    "homeTeam": "Jacareí",
    "awayTeam": "Iguanas",
    "matchDate": "2026-03-20T14:00:00Z",
    "evaluatorId": 2
  }'

# Response: { "matchId": 1, "matchUuid": "abc123" }

# 2. ÁRBITRO REGISTRA EVENTO (15:42 do 1º tempo)
curl -X POST http://localhost:3001/api/matches/1/events \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "penalty",
    "team": "A",
    "playerNumber": "10",
    "gameTime": "15:42",
    "refereeComment": "High tackle on #4",
    "highImpact": true,
    "fieldZone": "Attacking 22"
  }'

# 3. ANALISTA TIME A PREENCHE STATS
curl -X POST http://localhost:3001/api/analytics/teams/1/stats \
  -H "Authorization: Bearer <token_analista_A>" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 1,
    "actionType": "Scrum",
    "outcome": "Won",
    "playerNumber": "1-3",
    "fieldZone": "Attacking 22"
  }'

# 4. AVALIADOR CONSOLIDA
curl http://localhost:3001/api/matches/1 \
  -H "Authorization: Bearer <token_evaluator>"

# 5. IA ANALISA
curl -X POST http://localhost:3001/api/matches/1/ai-analysis \
  -H "Authorization: Bearer <token_evaluator>" \
  -H "Content-Type: application/json" \
  -d '{ "analysisType": "discipline" }'

# 6. AVALIADOR PREENCHE 14 RUBROS
curl -X POST http://localhost:3001/api/matches/1/evaluation \
  -H "Authorization: Bearer <token_evaluator>" \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [8, 9, 7, 8, 9, 8, 7, 8, 9, 8, 7, 8, 9, 8],
    "comments": ["Boa comunicação", "...", ...],
    "closingFeedback": "Excelente arbitragem"
  }'

# 7. EXPORTAR PDF
curl http://localhost:3001/api/matches/1/export/pdf \
  -H "Authorization: Bearer <token>" \
  -o match-1-summary.pdf
```

---

## 📊 Dados de Teste

### Usuários Padrão (Inserir no MySQL)

```sql
INSERT INTO users (email, password, full_name, role, is_active) VALUES
('referee@club.com', 'password123', 'João Pereira', 'referee', 1),
('analyst-a@club.com', 'password123', 'Silva Time A', 'analyst', 1),
('analyst-b@club.com', 'password123', 'Santos Time B', 'analyst', 1),
('evaluator@club.com', 'password123', 'Carlos Coach', 'evaluator', 1),
('admin@club.com', 'password123', 'Admin User', 'admin', 1);
```

### Competições Padrão

```sql
INSERT INTO competitions (name, year, league_id) VALUES
('Super 12 2026', 2026, 1),
('Série A - M16', 2026, 2),
('Série B - Feminino', 2026, 3);
```

---

## 🧪 Teste com Postman

### Importar Collection

1. Abra Postman
2. `Import` → `Link`
3. Cole: `https://api.postman.com/collections/...` (criar após)

Ou manual:

```json
{
  "info": {
    "name": "Rugby Analytics API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Auth Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "email": "referee@club.com",
          "password": "password123"
        }
      }
    },
    {
      "name": "Create Match",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/matches",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ]
      }
    }
  ]
}
```

---

## 📋 Checklist de Verificação

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] MySQL 8.0+ rodando (`mysql -u root -p`)
- [ ] Banco de dados criado
- [ ] Servidor iniciado (`npm run dev`)
- [ ] GET http://localhost:3001/ retorna resposta
- [ ] Login funcionando
- [ ] Criar partida funcionando
- [ ] Registrar evento funcionando
- [ ] Frontends carregando sem erros de CORS

---

## 🐛 Troubleshooting Rápido

### "Connection refused"
```bash
# MySQL não está rodando
# No macOS:
brew services start mysql-server

# No Linux:
sudo systemctl start mysql

# Verificar:
mysql -u root -p -e "SELECT 1"
```

### "CORS error"
```bash
# Adicionar headers no .env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### "JWT invalid"
```bash
# Verificar se token foi copiado corretamente do login
# Verificar se JWT_SECRET é igual em .env
```

### "Database not found"
```bash
mysql -u root -p
CREATE DATABASE rugby_control;
USE rugby_control;
# Importar schema.sql
```

---

## 📚 Documentação Rápida

| Documento | Propósito |
|-----------|----------|
| `EXECUTIVE-SUMMARY.md` | Visão geral do projeto |
| `IMPLEMENTATION-ROADMAP.md` | Plano 8 sprints |
| `backend-architecture.md` | Detalhes técnicos |
| `GIT-WORKFLOW.md` | Como trabalhar com branches |
| `server.js` | Código principal do backend |

---

## 🚀 Próximos Passos Após Setup

1. **Criar primeira partida**
   - Use interface Análise de Rugby Pro
   - Preencha dados pré-jogo
   - Registre alguns eventos

2. **Testar fluxo completo**
   - Time A preenche estatísticas
   - Time B preenche estatísticas
   - Avaliador consolida e exporta PDF

3. **Conectar Android**
   - Abra RugbyControl Pro no emulador
   - Configure URL base: `http://10.0.2.2:3001` (emulador local)
   - Teste sincronização de pontos

4. **Preparar para produção**
   - Setup Docker
   - Configure domínio
   - Ative HTTPS

---

## 💬 Suporte & Dúvidas

### Rápido
- Erro no backend? Veja logs em `console`
- Erro no frontend? Abra DevTools (F12)
- Erro no banco? `SHOW VARIABLES LIKE 'sql_mode'`

### Aprofundado
- API endpoints: Veja `server.js`
- Database: Veja `backend-architecture.md`
- Frontend: Veja comentários em HTML

---

## ✅ Conclusão

Você agora tem um **ecosistema completo de rugby analytics rodando localmente**!

### O que conseguiu:
✅ Backend com 10+ endpoints
✅ Autenticação com JWT
✅ Banco de dados estruturado
✅ 3 Frontends conectados
✅ Análise com IA (Gemini)
✅ Export PDF/JSON/CSV

### Próximo:
👉 Criar primeira partida real
👉 Treinar users nos 3 sistemas
👉 Fazer deploy em staging
👉 Entregar aos times Super 12

---

**Total de tempo:** ~30 minutos
**Dificuldade:** ⭐⭐☆☆☆ (Fácil)
**Resultado:** 🎯 Sistema pronto para testar

Bora rugby! 🏉
