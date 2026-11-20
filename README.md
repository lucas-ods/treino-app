# Treino

**Abrir o app:** https://lucas-ods.github.io/treino-app/

App web instalável (PWA) para acompanhar treinos de academia no celular. Funciona offline, e os dados ficam salvos no próprio aparelho.

## Funções
- Lista de treinos com os exercícios de cada um (já vem com os 6 treinos de referência)
- Iniciar treino: cronômetro do treino, carga e reps por série, coluna "Anterior" com o que você fez da última vez
- Descanso automático ao concluir uma série, com vibração e som no fim (dá para desligar no sino da tela de treino ou em Ajustes; tempo ajustável por exercício)
- Exercícios por tempo (prancha etc.) com cronômetro próprio para cada série
- Calendário com os dias treinados (cor de cada treino), detalhes de cada sessão e registro manual de um dia esquecido
- Criar, editar, reordenar, duplicar e excluir treinos
- Ilustração animada de cada exercício com passo a passo e dica (toque na miniatura). Ficam em `exercises.js`; exercícios novos são reconhecidos pelo nome
- Backup: exportar/importar em arquivo JSON

## Rodar no computador
```powershell
python -m http.server 8080
```
Abra http://localhost:8080.

## Instalar no celular
O app precisa estar num endereço **https** para instalar. A forma mais simples e gratuita é o GitHub Pages:
1. Crie um repositório no GitHub e envie estes arquivos (`index.html`, `app.js`, `exercises.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, pasta `icons`).
2. No repositório: **Settings → Pages → Branch: main / (root) → Save**.
3. Abra o link gerado no celular:
   - **Android (Chrome):** menu ⋮ → *Adicionar à tela inicial* / *Instalar app*.
   - **iPhone (Safari):** botão Compartilhar → *Adicionar à Tela de Início*.

## Observações
- Os dados ficam no navegador do aparelho. Use **Ajustes → Exportar dados** de vez em quando para ter um backup.
- iPhone não permite vibração por apps web; o som funciona com o celular fora do modo silencioso.
- Com a tela bloqueada o celular pausa o app, então o alerta de descanso toca quando você volta para ele. A opção *Manter tela ligada* (ativa por padrão) evita isso durante o treino.
- Ao publicar uma versão nova, altere `CACHE` em `sw.js` (ex.: `treino-v2`) para os celulares baixarem a atualização.
