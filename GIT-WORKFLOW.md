# 🌿 Git Workflow - Rugby Analytics Ecosystem

## Branch Strategy

```
main (production)
├── develop (staging)
├── feature/sprint-1-core
│   ├── feature/auth-system
│   ├── feature/matches-crud
│   └── feature/events-timeline
│
├── feature/sprint-2-analytics
│   ├── feature/websocket-sync
│   ├── feature/team-stats
│   └── feature/dashboard
│
├── feature/sprint-3-evaluation
│   ├── feature/14-rubros-form
│   ├── feature/ai-analysis
│   └── feature/pdf-export
│
└── bugfix/... (conforme necessário)
```

---

## 📝 Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Exemplos
```
feat(auth): add JWT authentication middleware

BREAKING CHANGE: Auth header format changed from Bearer to Token

feat(events): POST /api/matches/:id/events endpoint

fix(database): correct team_stats aggregation query

docs(api): add endpoint documentation

chore(deps): update Express to 4.19.0
```

---

## 🚀 Começar Novo Sprint

### Sprint 1 - Core Backend

```bash
# 1. Clone repositório
git clone <repo-url> rugby-analytics
cd rugby-analytics

# 2. Crie branch develop (se não existir)
git checkout -b develop

# 3. Crie branch de sprint
git checkout -b feature/sprint-1-core develop

# 4. Crie sub-branches para tarefas
git checkout -b feature/auth-system feature/sprint-1-core
# Implementar auth...
git add .
git commit -m "feat(auth): JWT authentication system"
git push -u origin feature/auth-system

# 5. Abra Pull Request
gh pr create --base feature/sprint-1-core --head feature/auth-system \
  --title "feat(auth): JWT authentication system" \
  --body "Implements JWT token generation and validation"

# 6. Após review, merge para sprint
git checkout feature/sprint-1-core
git pull origin feature/sprint-1-core
git merge feature/auth-system
git push

# 7. Repita para próximas features...
```

---

## 📋 Tarefas por Sprint

### ✅ Sprint 1: Core (Semanas 1-2)

```
□ Setup repositório e documentação
  ├─ branch: feature/sprint-1-core
  ├─ PR #1: docs: initial project structure
  └─ Task: README, contributing guide, architecture diagram

□ Database MySQL
  ├─ branch: feature/database-setup
  ├─ Task: schema.sql com todas as tabelas
  ├─ Índices e constraints
  └─ Sample data

□ Express.js Setup
  ├─ branch: feature/express-setup
  ├─ Middlewares (CORS, body-parser)
  ├─ Error handling
  └─ Environment config

□ Authentication (JWT)
  ├─ branch: feature/auth-system
  ├─ POST /api/auth/login
  ├─ JWT token generation
  └─ Token validation middleware

□ Matches CRUD
  ├─ branch: feature/matches-crud
  ├─ POST /api/matches (create)
  ├─ GET /api/matches/:id (retrieve)
  ├─ PUT /api/matches/:id (update)
  └─ GET /api/matches (list)

□ Events Timeline
  ├─ branch: feature/events-timeline
  ├─ POST /api/matches/:id/events (create)
  ├─ GET /api/matches/:id/events (list)
  ├─ DELETE /api/matches/:id/events/:eventId
  └─ Event validation

□ Tests & Documentation
  ├─ branch: feature/sprint-1-tests
  ├─ Unit tests com Jest
  ├─ Integration tests
  └─ API documentation (OpenAPI/Swagger)

FINAL: Merge feature/sprint-1-core para develop
```

### ✅ Sprint 2: Analytics (Semanas 3-4)

```
□ WebSocket Real-time Sync
  ├─ branch: feature/websocket-sync
  ├─ Socket.io setup
  ├─ Match events broadcast
  └─ Client reconnection logic

□ Team Statistics Aggregation
  ├─ branch: feature/team-stats
  ├─ POST /api/analytics/teams/:teamId/stats
  ├─ Automatic aggregation (team_stats table)
  └─ GET /api/matches/:id/analytics

□ Dashboard Endpoints
  ├─ branch: feature/analytics-dashboard
  ├─ GET /api/matches/:id/dashboard
  ├─ Consolidated data view
  └─ Performance optimization

□ Frontend Integration
  ├─ branch: feature/frontend-integration-1
  ├─ Connect Análise de Rugby Pro to backend
  ├─ Update endpoints in JavaScript
  └─ Test all CRUD operations

FINAL: Merge feature/sprint-2-analytics para develop
```

### ✅ Sprint 3: Evaluation & Export (Semana 5)

```
□ Evaluation Form (14 Rubros)
  ├─ branch: feature/evaluation-form
  ├─ POST /api/matches/:id/evaluation
  ├─ 14 score + comment fields
  ├─ Average score calculation
  └─ GET /api/matches/:id/evaluation

□ PDF Export
  ├─ branch: feature/pdf-export
  ├─ GET /api/matches/:id/export/pdf
  ├─ PDFKit document generation
  ├─ Include all data (pre-game, timeline, evaluation)
  └─ Digital signature support

□ CSV/JSON Export
  ├─ branch: feature/data-export
  ├─ GET /api/matches/:id/export/json
  ├─ GET /api/matches/:id/export/csv
  └─ Field selection API

FINAL: Merge feature/sprint-3-evaluation para develop
```

### ✅ Sprint 4: AI Integration (Semana 6)

```
□ Gemini API Setup
  ├─ branch: feature/gemini-integration
  ├─ @google/generative-ai SDK
  ├─ API key management
  └─ Prompt engineering

□ AI Analysis Endpoints
  ├─ branch: feature/ai-analysis
  ├─ POST /api/matches/:id/ai-analysis
  │  ├─ ?type=discipline (infractions)
  │  ├─ ?type=referee (performance)
  │  └─ ?type=training (suggestions)
  └─ Response caching

FINAL: Merge feature/sprint-4-ai para develop
```

### ✅ Sprint 5-6: Frontend & Integration (Semanas 7-8)

```
□ Mobile Android Integration
  ├─ branch: feature/android-api-client
  ├─ Retrofit setup
  ├─ Token management
  └─ RugbyControl Pro sync

□ Production Deployment
  ├─ branch: feature/docker-deploy
  ├─ Dockerfile setup
  ├─ docker-compose.yml
  ├─ CI/CD pipeline (.github/workflows)
  └─ Environment separation (dev/staging/prod)

FINAL: Merge feature/sprint-5-6-final para develop → main
```

---

## 🔄 Pull Request Workflow

### 1. Criar Feature Branch
```bash
git checkout -b feature/my-feature develop
# Implementar...
git add .
git commit -m "feat(scope): describe what was done"
git push -u origin feature/my-feature
```

### 2. Abrir Pull Request
```bash
gh pr create --base develop --head feature/my-feature \
  --title "feat(scope): Short description" \
  --body "
## Description
What does this PR accomplish?

## Changes
- Change 1
- Change 2

## Testing
How to test this?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
"
```

### 3. Code Review & Merge
```bash
# Após aprovação
gh pr merge 123 --squash --delete-branch

# Ou manual
git checkout develop
git pull origin develop
git merge feature/my-feature
git push origin develop
```

---

## 📊 Status Check

```bash
# Ver branches locais
git branch -a

# Ver commits não mergeados
git log --oneline develop..feature/sprint-1-core

# Ver diferenças
git diff develop...feature/sprint-1-core

# Verificar status
git status
```

---

## 🔐 Proteções de Branch

Configurar no GitHub:

```
Branching rules para main:
✅ Require pull request reviews (min 1)
✅ Dismiss stale review approvals
✅ Require status checks to pass (CI pipeline)
✅ Require branches to be up to date before merging
✅ Restrict who can push (admins only)
```

---

## 🛠️ Local Development Setup

### Primeira vez

```bash
git clone <repo-url>
cd rugby-analytics
cp .env.example .env  # Editar com suas credenciais
npm install
npm run dev           # Inicia com nodemon
```

### Mudar de branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Implementar...
# ...

# Sincronizar com develop
git fetch origin
git rebase origin/develop
git push -u origin feature/my-new-feature
```

### Cleanup local

```bash
# Deletar branches merged
git branch -d feature/completed-feature

# Atualizar branches deletadas remotamente
git fetch origin --prune

# Limpar histórico local
git gc --aggressive
```

---

## 📌 Important Files Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml              # Run tests on PR
│       ├── deploy-staging.yml  # Deploy to staging
│       └── deploy-prod.yml     # Deploy to production
│
├── .gitignore                   # Ignore node_modules, .env, etc
├── .env.example                 # Template de variáveis
│
├── src/
│   ├── server.js                # Entry point
│   ├── api/
│   ├── services/
│   ├── utils/
│   └── config/
│
├── tests/                        # Jest test files
├── docs/                         # Documentation
├── docker-compose.yml           # Local development
├── Dockerfile                   # Production image
├── package.json
└── README.md
```

---

## 🚨 Troubleshooting

### Merge Conflict
```bash
# Ver conflitos
git status

# Editar arquivo com conflito
# Depois:
git add .
git commit -m "fix: resolve merge conflict"
```

### Desfazer último commit (local)
```bash
git reset --soft HEAD~1
# Fazer mudanças
git commit -m "updated commit message"
```

### Desfazer último push (local tracked)
```bash
git reset --hard HEAD~1
git push origin feature/branch --force
# ⚠️ Cuidado! Só em branches pessoais
```

### Sincronizar fork
```bash
git remote add upstream https://github.com/original/repo
git fetch upstream
git checkout develop
git rebase upstream/develop
git push origin develop
```

---

## ✅ Pre-commit Checklist

Antes de fazer push:

- [ ] `npm run lint` - Sem erros
- [ ] `npm test` - Todos testes passam
- [ ] `npm run type-check` - TypeScript OK (se aplica)
- [ ] `.env` não foi commitado
- [ ] Commit message segue o padrão
- [ ] Branch está atualizado com develop
- [ ] Sem console.log() de debug

---

## 📞 Dúvidas Comuns

### Como resetar para develop?
```bash
git checkout develop
git reset --hard origin/develop
```

### Como fazer rebase interativo?
```bash
# Últimos 5 commits
git rebase -i HEAD~5
# Editar, salvar e confirmar
```

### Como renomear branch?
```bash
git branch -m old-name new-name
git push origin :old-name new-name
git push origin -u new-name
```

---

## 🎯 Resumo Rápido

```
Feature novo          │ git checkout -b feature/name develop
Implementar           │ Escrever código + testes
Commit                │ git commit -m "feat(scope): message"
Push                  │ git push -u origin feature/name
Pull Request          │ gh pr create --base develop
Revisar & Mergear     │ gh pr merge 123 --squash
Deletar branch        │ git branch -d feature/name
```

---

**Updated:** 2026-03-20
**Version:** 1.0

