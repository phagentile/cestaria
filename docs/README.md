# 📚 Documentação do Ralph

Bem-vindo à pasta de documentação! Aqui você encontrará guias completos para entender, configurar e usar o Ralph.

## 🗂️ Arquivo por Arquivo

### 📖 [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) - COMECE AQUI!
**Para:** Quem quer começar em 5 minutos  
**Contém:**
- O que é Ralph em linguagem simples
- 3 passos para começar
- Exemplo prático
- Troubleshooting rápido
- Tabela de problemas comuns

**Quando usar:** Você é novo no Ralph ou quer uma visão geral rápida.

---

### 🏗️ [ESTRUTURA_DO_REPOSITORIO.md](./ESTRUTURA_DO_REPOSITORIO.md)
**Para:** Entender como o repositório está organizado  
**Contém:**
- Mapa visual de todas as pastas (`/scripts/ralph`, `/skills`, `/flowchart`)
- Descrição de cada arquivo principal
- Fluxo de trabalho passo a passo
- Conceitos críticos explicados
- Instruções de setup detalhadas
- Referências a recursos

**Quando usar:** Você quer conhecer o projeto em profundidade ou está contribuindo.

---

## 🎯 Guia de Navegação por Cenário

### Cenário 1: "Sou Novo no Ralph"
1. Leia → [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) (5 min)
2. Execute os 3 passos para começar
3. Se precisar entender melhor → [ESTRUTURA_DO_REPOSITORIO.md](./ESTRUTURA_DO_REPOSITORIO.md)

### Cenário 2: "Preciso Configurar Ralph para Meu Projeto"
1. Siga a sessão "Instalação" em [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
2. Customize o prompt em `scripts/ralph/CLAUDE.md` ou `prompt.md`
3. Configure seus checks de qualidade (tests, typecheck)
4. Leia "Conceitos Importantes" em [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)

### Cenário 3: "Ralph Está Lento ou Não Funciona"
1. Veja "Troubleshooting" em [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
2. Verifique seus PRDs em [ESTRUTURA_DO_REPOSITORIO.md](./ESTRUTURA_DO_REPOSITORIO.md) - Seção "Tamanho Correto das Histórias"
3. Debugue com os comandos em [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) - Seção "Monitorando Ralph"

### Cenário 4: "Quero Aprofundar no Ralph"
1. Leia todo [ESTRUTURA_DO_REPOSITORIO.md](./ESTRUTURA_DO_REPOSITORIO.md)
2. Estude o código em `scripts/ralph/ralph.sh`
3. Explore os prompts em `scripts/ralph/CLAUDE.md`
4. Contribua com melhorias!

---

## 📋 Checklist Rápido

### ✅ Para Começar
- [ ] Li [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
- [ ] Instalei Ralph no meu projeto
- [ ] Criei meu primeiro PRD
- [ ] Converti para `prd.json`
- [ ] Executei `./scripts/ralph/ralph.sh`

### ✅ Para Usar em Produção
- [ ] Entendi a estrutura em [ESTRUTURA_DO_REPOSITORIO.md](./ESTRUTURA_DO_REPOSITORIO.md)
- [ ] Customizei o prompt para meu projeto
- [ ] Configurei tests e typecheck
- [ ] Li "Feedback Loops Essenciais" em [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
- [ ] Atualizo `AGENTS.md` após cada iteração

---

## 🔗 Links Úteis

| Recurso | Link | Descrição |
|---------|------|-----------|
| Artigo Original | [Geoffrey Huntley](https://huntle.org/) | Por que Ralph foi criado |
| Visualização | [../flowchart/](../flowchart/) | Fluxo interativo do Ralph |
| Documentação Amp | [docs.amp.dev](https://docs.amp.dev/) | Para usar com Amp |
| Documentação Claude Code | [anthropic.com](https://docs.anthropic.com/) | Para usar com Claude Code |
| GitHub Actions | [docs.github.com/actions](https://docs.github.com/actions) | Para CI/CD |

---

## 💬 Perguntas Frequentes

**P: Ralph vai escrever código ruim?**  
R: Ralph escreve código tão bom quanto o prompt que você fornecer. Customize bem e use feedback loops!

**P: Quanto tempo Ralph leva?**  
R: Depende de quantas histórias e da complexidade. Cada iteração = 1 história. Uma história simples = 2-5 minutos.

**P: E se uma história for muito grande?**  
R: Ralph fará do seu melhor, mas será pior. Divida em histórias menores (1-2h de trabalho cada).

**P: Preciso aprovar cada commit?**  
R: Não! Ralph faz commits automaticamente. Você revisa depois ou ativa um PR para review.

**P: Posso cancelar Ralph no meio?**  
R: Sim! `Ctrl+C` para parar. O progresso é salvo em `prd.json` e `git history`.

---

## 🎓 Próximos Passos

1. **Agora:** Leia [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
2. **Depois:** Siga os 3 passos para começar
3. **Então:** Customize para seu projeto
4. **Finalmente:** Compartilhe seu sucesso! 🚀

---

**Última atualização:** Abril de 2026  
**Versão:** 1.0  
**Mantido por:** Comunidade Ralph
