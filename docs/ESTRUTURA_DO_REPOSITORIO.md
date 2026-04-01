# Estrutura do Repositório Cestaria

## 📋 Visão Geral
Este repositório contém a implementação de **Ralph**, um loop de agente de IA autônomo que executa ferramentas de codificação de IA repetidamente até que todos os itens do PRD (Product Requirements Document) estejam concluídos.

## 🗂️ Estrutura de Pastas

### `/scripts/ralph`
Contém o script principal de automação.
- **ralph.sh**: O bash loop que inicia novas instâncias de IA (Amp ou Claude Code)
- **prompt.md**: Template de prompt para Amp
- **CLAUDE.md**: Template de prompt para Claude Code

### `/skills`
Contém habilidades personalizadas para IA.

#### `/skills/prd`
- Gera documentos de requisitos do produto (PRD)
- Usada com o comando: `/prd` ou "criar um prd"

#### `/skills/ralph`
- Converte PRDs para formato prd.json
- Usada com o comando: `/ralph` ou "converter este prd"

### `/flowchart`
Visualização interativa de como Ralph funciona.
- **npm install**: Instala dependências
- **npm run dev**: Executa o servidor de desenvolvimento local

### `/docs`
Documentação e guias do projeto.
- **ESTRUTURA_DO_REPOSITORIO.md**: Este arquivo
- Guias de configuração e uso

### `/.claude-plugin`
Plugin manifest para integração com Claude Code marketplace.

### `/.github/workflows`
Arquivos de workflow do GitHub Actions para CI/CD.

## 🔑 Arquivos Principais

| Arquivo | Propósito |
|---------|-----------|
| `README.md` | Documentação principal do projeto |
| `prd.json` | Lista de histórias de usuário com status (passes: true/false) |
| `prd.json.example` | Exemplo do formato de PRD |
| `progress.txt` | Registro de aprendizados de iterações anteriores |
| `AGENTS.md` | Padrões e gotchas descobertos durante execução |
| `CLAUDE.md` | Instruções específicas para Claude Code |
| `.gitignore` | Arquivos a ignorar no controle de versão |
| `LICENÇA` | Licença MIT |

## 🚀 Fluxo de Trabalho Principal

### 1. Criar um PRD
```bash
# Carregue a habilidade PRD e crie um novo documento
Load the prd skill and create a PRD for [descrição da funcionalidade]
```

### 2. Converter PRD para Formato Ralph
```bash
# Converte markdown para JSON estruturado
Load the ralph skill and convert tasks/prd-[feature-name].md to prd.json
```

### 3. Executar Ralph
```bash
# Usando Amp (padrão)
./scripts/ralph/ralph.sh [max_iterations]

# Usando Claude Code
./scripts/ralph/ralph.sh --tool claude [max_iterations]
```

## 📝 Conceitos Críticos

### Cada Iteração = Contexto Limpo
- Cada iteração cria uma **nova instância de IA** com contexto vazio
- Memória persiste via:
  - Histórico de commits do Git
    - Arquivo `progress.txt` (aprendizados)
      - Arquivo `prd.json` (status das tarefas)

      ### Tamanho Correto das Histórias
      **Histórias bem dimensionadas:**
      - Adicionar coluna de banco de dados
      - Criar componente UI
      - Atualizar server action com nova lógica
      - Adicionar filtro dropdown

      **Histórias muito grandes (dividir):**
      - "Construir todo o dashboard"
      - "Adicionar autenticação"
      - "Refatorar a API"

      ### Feedback Loops Essenciais
      Ralph funciona SOMENTE se houver:
      1. **Typecheck** - Detecta erros de tipo
      2. **Testes** - Verificam comportamento
      3. **CI verde** - Previne acúmulo de código quebrado
      4. **Verificação em navegador** - Para histórias de UI

      ### Padrão de Atualização AGENTS.md
      Após cada iteração, Ralph atualiza arquivos `AGENTS.md` com:
      - Padrões descobertos ("este código usa X para Y")
      - Gotchas ("não esqueça de atualizar Z ao mudar W")
      - Contexto útil ("o painel de configurações está em X")

      ## 🔧 Configuração

      ### Opção 1: Copiar para seu Projeto
      ```bash
      mkdir -p scripts/ralph
      cp /path/to/ralph/ralph.sh scripts/ralph/
      cp /path/to/ralph/prompt.md scripts/ralph/  # Para Amp
      # OU
      cp /path/to/ralph/CLAUDE.md scripts/ralph/  # Para Claude Code
      chmod +x scripts/ralph/ralph.sh
      ```

      ### Opção 2: Instalar Globalmente (Amp)
      ```bash
      cp -r skills/prd ~/.config/amp/skills/
      cp -r skills/ralph ~/.config/amp/skills/
      ```

      ### Opção 3: Claude Code Marketplace
      ```bash
      /plugin marketplace add snarktank/ralph
      /plugin install ralph-skills@ralph-marketplace
      ```

      ## 🧪 Debugging

      ### Ver Status Atual
      ```bash
      # Ver quais histórias estão prontas
      cat prd.json | jq '.userStories[] | {id, title, passes}'

      # Ver aprendizados de iterações anteriores
      cat progress.txt

      # Ver histórico de commits
      git log --oneline -10
      ```

      ## 📦 Linguagens e Tecnologias

      Este repositório contém:
      - **Bash** - Scripts de automação (ralph.sh)
      - **Markdown** - Documentação (README, AGENTS, prompts)
      - **JSON** - Configuração de tarefas (prd.json)
      - **JavaScript** - Visualização interativa (flowchart)

      ## 📚 Recursos Adicionais

      - [Artigo Original sobre Ralph - Geoffrey Huntley](https://huntle.org/)
      - [Documentação do Amp](https://docs.amp.dev/)
      - [Documentação do Claude Code](https://docs.anthropic.com/)
      - [GitHub Actions Documentation](https://docs.github.com/actions)

      ## 📄 Licença

      Este projeto é licenciado sob a Licença MIT - veja o arquivo `LICENÇA` para detalhes.

      ---

      **Última atualização:** Abril de 2026
      **Versão:** 1.0
