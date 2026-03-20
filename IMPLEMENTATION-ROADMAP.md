# 🏉 Rugby Analytics Ecosystem - Roadmap de Implementação

## 📊 Visão Geral do Projeto

**Objetivo:** Criar um ecosistema integrado que unifique árbitros, analistas de vídeo e avaliadores em uma única plataforma de análise de rugby.

**Resultado Final:** Sistema completo entregue aos times do Super 12 para captura, análise e relatório de partidas.

---

## 🎯 Roadmap Técnico (8 Sprints)

### **Sprint 1-2: Foundation (Semanas 1-2)**
**Foco:** Setup infraestrutura e CRUD básico

- [x] Criar banco de dados MySQL (schema completo)
- [x] Setup Express.js + Node.js
- [x] JWT authentication
- [x] Endpoints POST/GET /api/matches
- [x] Endpoints POST /api/matches/:id/events
- [ ] Testes unitários (Jest)
- [ ] Deploy local (docker-compose)

**Deliverables:**
```
✓ server.js com rotas básicas
✓ database schema criado
✓ docker-compose.yml pronto
✓ Postman collection com endpoints
```

**Comandos para começar:**
```bash
# Criar projeto Node
mkdir rugby-backend && cd rugby-backend
npm init -y

# Instalar dependências
npm install express mysql2 cors body-parser jwt-simple pdfkit dotenv

# Criar .env
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=rugby_control
JWT_SECRET=rugby-secret-key-2026
GEMINI_API_KEY=sua_chave_aqui
EOF

# Rodar servidor
node server.js
```

---

### **Sprint 3: Analytics Pipeline**
**Foco:** Conectar dados do Rugby Analytics Platform Pro

- [ ] Endpoint POST /api/analytics/teams/:teamId/stats
- [ ] Agregações automáticas (team_stats)
- [ ] Dashboard consolidado GET /api/matches/:id/analytics
- [ ] WebSocket para sync em tempo real (Socket.io)
- [ ] Validação de permissões por team

**Arquivos a criar:**
```
src/
├── websocket-server.js       # Socket.io setup
├── services/analyticsService.js
└── middleware/teamValidation.js
```

---

### **Sprint 4: PDF & Export**
**Foco:** Importação/Exportação de súmula

- [ ] PDF generation com pdfkit (POST /matches/:id/events → PDF)
- [ ] CSV export endpoint
- [ ] JSON export endpoint
- [ ] PDF parser para importação de súmula inicial
- [ ] Validação de integridade de dados

**Dependência:**
```bash
npm install pdfkit pdf-parse multer
```

**Teste manual:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/matches/1/export/pdf > match-1.pdf
```

---

### **Sprint 5: Evaluation System (14 Rubros)**
**Foco:** Sistema de avaliação pós-jogo

- [ ] Endpoint POST /api/matches/:id/evaluation
- [ ] Cálculo automático de score médio
- [ ] Validação de range (1-10)
- [ ] Storage em match_evaluations
- [ ] GET /api/matches/:id/evaluation

**Schema atualizado:**
```sql
ALTER TABLE match_evaluations ADD UNIQUE(match_id);
```

---

### **Sprint 6: AI Integration (Gemini)**
**Foco:** Análise inteligente com Google Gemini

- [ ] Setup Google Generative AI SDK
- [ ] Endpoint POST /api/matches/:id/ai-analysis
- [ ] 3 tipos de análise:
  - `discipline`: Análise de infrações
  - `referee`: Avaliação de arbitragem
  - `training`: Sugestões de treino
- [ ] Cache de resultados IA
- [ ] Integração com Análise de Rugby Pro

**Setup Gemini:**
```bash
npm install @google/generative-ai
```

**Teste:**
```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent('Analise esses eventos...');
```

---

### **Sprint 7: Frontend Integration**
**Foco:** Conectar os 3 frontends ao backend

#### 7a) Análise de Rugby Pro (integração existente)
```javascript
// Em html principal, substituir endpoints mock por reais
const API_BASE = 'http://localhost:3001/api';

// Ao salvar evento:
async function saveEvent(event) {
  const response = await fetch(
    `${API_BASE}/matches/${matchID}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  );
  return response.json();
}
```

#### 7b) Rugby Analytics Platform Pro (atualizar localStorage → API)
```javascript
// Substituir saveData() para usar API
async function saveData() {
  const response = await fetch(
    `${API_BASE}/analytics/teams/${teamId}/stats`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(state.events)
    }
  );
}
```

#### 7c) RugbyControl Pro (Android → API)
```kotlin
// Retrofit client para chamar API
interface RugbyApiService {
  @POST("/api/matches/{id}/events")
  suspend fun saveEvent(
    @Path("id") matchId: Int,
    @Body event: MatchEvent
  ): EventResponse
}
```

---

### **Sprint 8: Deployment & Hardening**
**Foco:** Produção-ready

- [ ] Docker containerization
- [ ] Environment separation (dev/staging/prod)
- [ ] Rate limiting + DDoS protection
- [ ] Logs centralizados (Winston)
- [ ] Backup automatizado (MySQL dumps)
- [ ] HTTPS + SSL certificates
- [ ] Security audit (OWASP top 10)
- [ ] Performance optimization (Redis caching)
- [ ] Documentation completa

**Docker Setup:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

---

## 📁 Estrutura Final do Repositório

```
rugby-ecosystem/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   └── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── config/
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend-referee/              # Análise de Rugby Pro
│   ├── index.html
│   ├── assets/
│   └── js/
│
├── frontend-analytics/            # Rugby Analytics Platform Pro
│   ├── index.html
│   ├── styles/
│   └── scripts/
│
├── mobile-android/                # RugbyControl Pro (Android)
│   ├── app/
│   ├── build.gradle
│   └── src/
│
├── docs/
│   ├── API-REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── USER-GUIDE.md
│
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
│
├── README.md
└── IMPLEMENTATION-ROADMAP.md
```

---

## 🚀 Quick Start Guide

### Pré-requisitos
- Node.js 18+
- MySQL 8+
- Docker & Docker Compose (opcional)
- Git

### Setup Local (5 minutos)

```bash
# 1. Clone o repositório
git clone <repo-url> rugby-ecosystem
cd rugby-ecosystem/backend

# 2. Instale dependências
npm install

# 3. Configure o banco de dados
mysql -u root -p < ../docs/schema.sql

# 4. Crie .env
cp .env.example .env
# Edite .env com suas credenciais

# 5. Inicie servidor
npm run dev    # nodemon para desenvolvimento
# ou
node server.js # produção

# 6. Teste endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ref@club.com","password":"pass123"}'

# 7. Abra os frontends
# Análise de Rugby Pro:   file:///<path>/frontend-referee/index.html
# Analytics Platform:     file:///<path>/frontend-analytics/index.html
# RugbyControl (Android): Compile via Android Studio
```

---

## 🔑 Fluxo Crítico de Dados

### Exemplo Completo: Árbitro → Analista → Avaliador

```
1️⃣ ÁRBITRO INICIA PARTIDA (Análise de Rugby Pro)
   └─ POST /api/auth/login → obtem token
   └─ POST /api/matches
      { homeTeam: "Jacareí", awayTeam: "Iguanas", ... }
      ↓ Response: { matchId: 1, matchUuid: "uuid..." }

2️⃣ DURANTE O JOGO - ÁRBITRO REGISTRA EVENTOS
   └─ POST /api/matches/1/events
      { eventType: "penalty", team: "A", gameTime: "15:42", ... }
      ↓ Real-time sync → Análise de Rugby Pro atualiza

3️⃣ ANALISTA TIME A PREENCHE ESTATÍSTICAS (Analytics Platform)
   └─ POST /api/analytics/teams/1/stats
      { matchId: 1, actionType: "Scrum", outcome: "Won", ... }
      ↓ team_stats agregam automaticamente

4️⃣ ANALISTA TIME B PREENCHE ESTATÍSTICAS
   └─ POST /api/analytics/teams/2/stats
      (mesmo processo)

5️⃣ FIM DO JOGO - AVALIADOR CONSOLIDA
   └─ GET /api/matches/1  ← Recebe TODOS os dados consolidados
      {
        referee_events: [...],
        team_a_stats: {...},
        team_b_stats: {...},
        consolidated: true
      }

   └─ POST /api/matches/1/ai-analysis?type=discipline
      ↓ Gemini analisa e retorna relatório IA

   └─ POST /api/matches/1/evaluation
      { scores: [8, 9, 7, ...], comments: [...], ... }
      ↓ Calcula média automática

6️⃣ EXPORTAR SÚMULA FINAL
   └─ GET /api/matches/1/export/pdf
      ↓ PDF gerado com todos os dados + avaliação

7️⃣ ENVIAR AOS TIMES (Super 12)
   └─ Email ou Portal com link de download
      └─ JSON export também disponível para análise própria
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Core (Sprint 1-2)
- [ ] Database schema criado
- [ ] Endpoints básicos funcionando
- [ ] JWT authentication validado
- [ ] Tests escritos para /api/matches

### Fase 2: Analytics (Sprint 3-5)
- [ ] WebSocket sync ativo
- [ ] PDF generation testado
- [ ] Evaluation form funcionando
- [ ] Team stats agregando corretamente

### Fase 3: AI + Integration (Sprint 6-7)
- [ ] Gemini API integrada
- [ ] 3 tipos de análise IA funcionando
- [ ] Frontends conectados ao backend
- [ ] Android app sincronizando dados

### Fase 4: Deployment (Sprint 8)
- [ ] Docker containers buildados
- [ ] CI/CD pipeline automático
- [ ] Staging environment ativo
- [ ] Documentação completa
- [ ] Security audit passado
- [ ] Backup system testado

---

## 🎓 Recursos Adicionais

### Documentação Recomendada
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Google Generative AI SDK](https://ai.google.dev/docs)
- [PDFKit Documentation](http://pdfkit.org/)
- [Socket.io Real-time Events](https://socket.io/docs/v4/)

### Comunidades
- Stack Overflow (tag: `express`, `mysql`)
- GitHub Discussions deste projeto
- World Rugby Technical Committee

---

## 💡 Próximos Passos Imediatos

**HOJE:**
1. [ ] Crie a database com schema.sql
2. [ ] Setup o repository com estrutura padrão
3. [ ] Teste `/api/auth/login` localmente

**SEMANA 1:**
1. [ ] Implemente todos endpoints de matches
2. [ ] Configure WebSocket para sync tempo real
3. [ ] Teste arquitetura com dados fictícios

**SEMANA 2:**
1. [ ] Conecte Análise de Rugby Pro ao backend
2. [ ] Conecte Rugby Analytics Platform ao backend
3. [ ] Teste fluxo completo árbitro → avaliador

---

## 📞 Suporte & Contactos

- **Arquiteto Principal:** Claude AI (este projeto)
- **Time de Rugby:** [Seu time aqui]
- **Fornecedor Gemini:** Google Cloud Support
- **Suporte MySQL:** Documentação oficial

---

**Atualizado:** 2026-03-20
**Versão:** 1.0 - Initial Roadmap
**Status:** 🟢 Ready to Start Implementation
