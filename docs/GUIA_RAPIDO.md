# 🚀 Guia Rápido do Ralph

## O que é Ralph?

Ralph é um **loop de agente de IA autônomo** que funciona como um desenvolvedor robô. Ele executa tarefas de codificação repetidamente até completar todas as histórias de um PRD (Documento de Requisitos de Produto).

**Fluxo simples:**
1. Você cria um PRD (especificação do que fazer)
2. 2. Ralph converte para JSON estruturado
   3. 3. Ralph executa loop: pega tarefa → implementa → testa → aprende → próxima tarefa
      4. 4. Loop continua até tudo estar pronto ✅
        
         5. ---
        
         6. ## ⚡ Início Rápido em 5 Minutos
        
         7. ### Pré-requisitos
         8. - Uma das ferramentas de IA: **Amp** ou **Claude Code**
            - - `jq` instalado (para JSON)
              - - Um repositório Git para seu projeto
               
                - ### Instalação (escolha uma opção)
               
                - **Opção A: Copiar arquivos**
                - ```bash
                  cd seu-projeto
                  mkdir -p scripts/ralph
                  cp -r /path/to/ralph/scripts/ralph/* scripts/ralph/
                  cp /path/to/ralph/CLAUDE.md scripts/ralph/
                  chmod +x scripts/ralph/ralph.sh
                  ```

                  **Opção B: Usar Marketplace (Claude Code)**
                  ```bash
                  /plugin marketplace add snarktank/ralph
                  /plugin install ralph-skills@ralph-marketplace
                  ```

                  ### 3 Passos para Começar

                  #### 1️⃣ Criar um PRD
                  ```bash
                  # Peça ao Claude Code:
                  "Create a PRD for adding a dark mode toggle to our dashboard"
                  ```

                  Isso gera um arquivo: `tasks/prd-dark-mode.md`

                  #### 2️⃣ Converter para JSON
                  ```bash
                  # Peça ao Claude Code:
                  "Convert tasks/prd-dark-mode.md to prd.json using the ralph skill"
                  ```

                  Isso cria: `prd.json` com histórias estruturadas

                  #### 3️⃣ Executar Ralph
                  ```bash
                  # Usando Claude Code (padrão)
                  ./scripts/ralph/ralph.sh claude 10

                  # Ou usando Amp
                  ./scripts/ralph/ralph.sh amp 10
                  ```

                  Ralph vai:
                  - Criar uma branch (ex: `dark-mode`)
                  - - Executar cada história uma a uma
                    - - Testar e validar
                      - - Fazer commits automaticamente
                        - - Sair quando terminar ou atingir 10 iterações
                         
                          - ---

                          ## 🎯 Exemplo Prático

                          ### Cenário: Adicionar filtro de data ao dashboard

                          **Passo 1: Create PRD**
                          ```
                          Feature: Date range filter on dashboard

                          Acceptance criteria:
                          - Add date picker UI
                          - Filter data by selected range
                          - Show filtered results in real-time
                          ```

                          **Passo 2: Ralph executa**
                          ```
                          Iteração 1: Add date picker component
                            ✅ Typecheck passed
                            ✅ Tests passed
                            ✅ Commit: "feat: add date picker UI"

                          Iteração 2: Connect filter to data
                            ✅ Typecheck passed
                            ✅ Tests passed
                            ✅ Commit: "feat: connect filter to data"

                          Iteração 3: Verify in browser
                            ✅ Works as expected
                            ✅ COMPLETE
                          ```

                          ---

                          ## 🧠 Conceitos Importantes

                          ### ✅ Tamanhas Corretas de Histórias

                          **Bom (cabe em um contexto):**
                          - Adicionar um campo de formulário
                          - - Criar componente UI
                            - - Escrever função de validação
                              - - Adicionar um endpoint de API
                               
                                - **Ruim (muito grande, partir em 3-5):**
                                - - "Construir autenticação completa"
                                  - - "Refatorar toda a API"
                                    - - "Criar sistema de permissões"
                                     
                                      - ### 🔄 Feedback Loops Essenciais
                                     
                                      - Ralph precisa de:
                                      - 1. **Typecheck** → `npm run typecheck` ou equivalente
                                        2. 2. **Testes** → `npm test` para verificar lógica
                                           3. 3. **CI/CD verde** → Sem código quebrado acumulando
                                              4. 4. **Navegador** → Para UI, incluir "Verify in browser" nos critérios
                                                
                                                 5. ### 📝 Aprendizados Persistem
                                                
                                                 6. Entre iterações, Ralph lembra via:
                                                 7. - `progress.txt` → O que aprendeu
                                                    - - `git history` → O que foi feito
                                                      - - `prd.json` → Qual é o próximo
                                                       
                                                        - Então cada iteração começa "fresco" mas com conhecimento!
                                                       
                                                        - ---

                                                        ## 📊 Monitorando Ralph em Ação

                                                        ### Ver qual é a próxima tarefa
                                                        ```bash
                                                        cat prd.json | jq '.userStories[] | select(.passes == false) | .title' | head -1
                                                        ```

                                                        ### Ver histórico de aprendizados
                                                        ```bash
                                                        tail -20 progress.txt
                                                        ```

                                                        ### Ver commits feitos
                                                        ```bash
                                                        git log --oneline -10
                                                        ```

                                                        ### Ver status de todas as histórias
                                                        ```bash
                                                        cat prd.json | jq '.userStories[] | {id, title, passes}'
                                                        ```

                                                        ---

                                                        ## ⚙️ Customização

                                                        Após copiar Ralph, customize o arquivo de prompt:

                                                        **Para Claude Code** → Edite `scripts/ralph/CLAUDE.md`
                                                        **Para Amp** → Edite `scripts/ralph/prompt.md`

                                                        Adicione:
                                                        ```markdown
                                                        ### Project Context
                                                        - Stack: React + TypeScript + Postgres
                                                        - Folder structure: src/components, src/pages, src/api
                                                        - Run tests: npm test
                                                        - Typecheck: npm run typecheck

                                                        ### Common Patterns
                                                        - All components in src/components/
                                                        - API routes in src/api/
                                                        - Use React hooks for state

                                                        ### Gotchas
                                                        - Remember to update schema migrations
                                                        - Always add tests for new functions
                                                        ```

                                                        ---

                                                        ## 🐛 Troubleshooting

                                                        | Problema | Solução |
                                                        |----------|---------|
                                                        | Ralph para no meio do caminho | Aumente `max_iterations` (ex: `./scripts/ralph/ralph.sh 20`) |
                                                        | Erro "typecheck failed" | Histórias muito grandes, dividir em partes menores |
                                                        | Tests não rodando | Adicione comandos de teste no prompt customizado |
                                                        | Ralph não pega nova tarefa | Reinicie o script ou verifique `prd.json` |
                                                        | Git commits quebrados | CI deve estar passando antes de continuR |

                                                        ---

                                                        ## 📚 Próximos Passos

                                                        1. **Leia** `docs/ESTRUTURA_DO_REPOSITORIO.md` para entender todas as pastas
                                                        2. 2. **Customize** `scripts/ralph/CLAUDE.md` ou `prompt.md` para seu projeto
                                                           3. 3. **Configure** suas verificações de qualidade (typecheck, tests, CI)
                                                              4. 4. **Inicie** com PRDs pequenos (1-3 histórias)
                                                                 5. 5. **Acompanhe** commits no Git enquanto Ralph executa
                                                                   
                                                                    6. ---
                                                                   
                                                                    7. ## 🎓 Recursos Adicionais
                                                                   
                                                                    8. - 📖 [Artigo sobre Ralph - Geoffrey Huntley](https://huntle.org/)
                                                                       - - 🎬 [Visualização do fluxo](../flowchart/)
                                                                         - - 📋 [Estrutura completa](./ESTRUTURA_DO_REPOSITORIO.md)
                                                                           - - 🔧 [Configuração avançada](#)
                                                                            
                                                                             - ---

                                                                             ## 💡 Dica Final

                                                                             Ralph funciona melhor quando:
                                                                             - ✅ Histórias são pequenas (1-2 horas de trabalho)
                                                                             - - ✅ Testes e typecheck passam
                                                                               - - ✅ Você atualiza AGENTS.md com padrões descobertos
                                                                                 - - ✅ Usa feedback loops (browser para UI, testes para lógica)
                                                                                  
                                                                                   - **Comece pequeno, iterando rápido!** 🚀
