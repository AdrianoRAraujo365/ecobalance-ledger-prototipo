# EcoBalance Ledger — Governança ESG e Calculadora Sustentável

Calculadora com **Modelo de Leontief** (motor NumPy), **Score ESG**, **simulador de ROI**, **ledger SHA-256**, **notificações** e autenticação **JWT** (usuários) + **OAuth 2.0** (integrações).
Backend Node.js com **Express, Sequelize, Body-parser e Handlebars** (MVC + REST) sobre **MySQL**. A interface original continua disponível, e agora há clientes separados em **React** e **Vue** que consomem a mesma API e respeitam os mesmos perfis.

## Acesso inicial

| Campo | Valor |
|---|---|
| E-mail | `adm-ecobalance@gmail.com` |
| Senha | Configure localmente em `ADMIN_PASSWORD` no arquivo `.env` |
| Perfil | Gerente de Sustentabilidade (todas as permissões) |

Criado pelo seeder `001-admin.js`. Defina `ADMIN_PASSWORD` no `.env` antes de executar o primeiro seed; a senha não fica versionada no código nem neste README. Em instalações existentes, a troca de credencial deve ser feita pelo menu do usuário.

## Como rodar

### Docker (recomendado)
```bash
cp .env.example .env     # no Windows PowerShell: Copy-Item .env.example .env
# Defina ADMIN_PASSWORD, JWT_SECRET, OAUTH_SECRET (diferentes entre si) e PY_API_KEY no .env
docker compose up --build
```
Abra http://localhost:3000 (MySQL, motor NumPy e app sobem juntos; migrations e seeders rodam sozinhos). Os clientes ficam em http://localhost:3000/react e http://localhost:3000/vue. phpMyAdmin opcional: `docker compose --profile tools up` → http://localhost:8080.

### Sem Docker
```bash
npm install
cp .env.example .env               # no Windows PowerShell: Copy-Item .env.example .env
# Configure ADMIN_PASSWORD, JWT_SECRET, OAUTH_SECRET e PY_API_KEY no .env
# MySQL: CREATE DATABASE ecobalance_ledger CHARACTER SET utf8mb4; (+ usuário conforme o .env)
npm run db:migrate && npm run db:seed
# motor NumPy (opcional; sem ele o cálculo usa o fallback em JavaScript)
cd python && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
PY_API_KEY=<mesma do .env> python app.py                          # http://127.0.0.1:5001
# em outro terminal, na raiz:
npm run dev
```
Dados de demonstração (série 2015–2026 + um usuário por perfil): `SEED_DEMO=true` e `SEED_DEMO_PASSWORD=<senha>` no `.env`, depois `npm run db:seed`. Os extremos da série (CO₂ 1.200 → 820 t) vêm do artigo; o restante é ilustrativo.

### Clientes React e Vue
```bash
npm run build:frontends
```
O build coloca os bundles em `src/public/apps`; com o servidor Express ativo, acesse `/react` ou `/vue`. Para desenvolver um cliente com hot reload, inicie o backend em um terminal e use `npm run dev:react` (porta 5173) ou `npm run dev:vue` (porta 5174). Ambos encaminham `/api/v1` e `/oauth` ao backend e usam o cookie JWT httpOnly, sem salvar tokens no navegador.

A documentação interativa OpenAPI/Swagger fica em `/api-docs` e o schema JSON em `/api-docs/openapi.json`. Os clientes incluem dashboard ESG, gráficos, mapa demonstrativo, calculadora matricial, simulador de ROI com exportação PDF, ledger e notificações.

## Bibliotecas e frameworks

| Camada | Tecnologia | Uso |
|---|---|---|
| Front-end | **Handlebars, React 18 e Vue 3** | UI MVC existente e dois clientes modulares separados, compartilhando API e autenticação |
| Front-end | **Bootstrap 5.3** | componentes e estilos compilados junto dos clientes React/Vue e usados pela interface existente |
| Front-end | **Tailwind CSS 3.4** | utilitários com prefixo `tw-` e sem *preflight* (convive com Bootstrap sem conflito) |
| Front-end | **jQuery 3.7** | AJAX para a API REST, DOM e eventos na interface existente |
| Front-end | **Chart.js 4 e Leaflet** | gráficos ESG/ROI e mapa com lista acessível de locais ilustrativos |
| Relatórios | **jsPDF** | exportação local dos relatórios ESG e simulação de investimento |
| Cálculo | **NumPy** (Flask) | `X = (I − A)⁻¹ D`, menores principais (Hawkins-Simons), inversa |
| Backend | Express 4, Sequelize 6, mysql2, body-parser, express-handlebars, Swagger UI Express | MVC, ORM, views e documentação OpenAPI |
| Segurança | jsonwebtoken, bcryptjs, helmet, cors, express-validator | JWT, hash de senha, CSP, validação |

> Os bundles React/Vue compilam Bootstrap e Tailwind localmente. A interface Handlebars legada mantém Bootstrap, jQuery e Tailwind CDN para compatibilidade.

## Perfis e permissões

| Permissão | Usuário | Analista | Auditor | Gerente |
|---|:-:|:-:|:-:|:-:|
| Ver dashboard e indicadores | ✔ | ✔ | ✔ | ✔ |
| Calculadora (Leontief, Score, ROI) | ✔ | ✔ | ✔ | ✔ |
| Criar indicadores ESG | – | ✔ | – | ✔ |
| Cadastrar coeficientes de Leontief | – | ✔ | – | ✔ |
| Ver ledger | ✔ | ✔ | ✔ | ✔ |
| Verificar integridade do ledger | – | – | ✔ | ✔ |
| Listar usuários | – | – | ✔ | ✔ |
| Criar/editar/desativar usuários | – | – | – | ✔ |
| Enviar notificações / gerir clientes OAuth | – | – | – | ✔ |

Fonte única: `src/config/permissions.js` (usada pela API, pelas views e pelo menu). O perfil e o status `ativo` são **relidos do banco a cada requisição**. O cadastro público sempre cria `usuario`; o Gerente não altera nem desativa a própria conta.

## Notificações
Internas, por usuário (`GET/PATCH /api/v1/notifications`, badge no menu). São geradas automaticamente quando: um indicador ESG é registrado (avisa Gerentes e Auditores), a integridade do ledger falha (avisa Gerentes), uma conta é criada, o perfil muda ou a senha é alterada. O Gerente (ou um sistema externo via OAuth) envia mensagens por perfil em `POST /api/v1/notifications`.

### Triagem GLOBALG.A.P.
Ao criar um indicador ESG, conformidade genérica abaixo de `GLOBALGAP_COMPLIANCE_THRESHOLD` gera uma notificação interna para Gerentes de Sustentabilidade e Auditores. O limite padrão é **80%** e pode ser alterado no `.env` (valor entre 0 e 100). Isso é apenas uma regra de triagem configurável baseada no campo genérico `conformidade`; não acessa dados da GLOBALG.A.P., não implementa seu checklist de controle e não comprova auditoria nem certificação oficial.

## OAuth 2.0 (máquina a máquina)
Fluxo `client_credentials` (RFC 6749) e revogação (RFC 7009). O Gerente cria clientes em **Integrações** (o `client_secret` aparece uma única vez; só o hash SHA-256 é guardado).
```bash
curl -X POST http://localhost:3000/oauth/token -u CLIENT_ID:CLIENT_SECRET \
  -d grant_type=client_credentials -d scope="notifications:write"

curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"perfil":"gerente_sustentabilidade","titulo":"Meta atingida","mensagem":"CO2 abaixo do limite","tipo":"sucesso"}'

curl http://localhost:3000/api/v1/external/esg-summary -H "Authorization: Bearer ACCESS_TOKEN"   # scope esg:read
curl -X POST http://localhost:3000/oauth/revoke -u CLIENT_ID:CLIENT_SECRET -d token=ACCESS_TOKEN
```
Tokens OAuth usam `OAUTH_SECRET` (diferente do `JWT_SECRET`) e `typ=oauth`; tokens de login usam `typ=user`. Um não vale no lugar do outro. Tokens são registrados e podem ser revogados; desativar o cliente invalida todos.

## API REST — `/api/v1`
| Método | Rota | Quem |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | público |
| GET / PATCH | `/auth/me` · `/auth/password` | autenticado |
| GET / POST / PATCH | `/users`, `/users/:id` | `users:read` / `users:write` |
| GET · POST | `/esg-indicators` (+ `/summary`) | `esg:read` · `esg:write` |
| GET · POST | `/leontief-entries` | autenticado · `leontief:write` |
| POST | `/leontief/calculate` | `leontief:calculate` |
| GET | `/ledger-blocks` · `/ledger-blocks/verification` | `ledger:read` · `ledger:verify` |
| GET / PATCH / POST | `/notifications` (`/unread-count`, `/:id`) | autenticado; POST: Gerente ou OAuth |
| GET / POST / PATCH | `/oauth/clients` | `oauth:manage` |
| GET | `/external/esg-summary` | OAuth `esg:read` |
| POST | `/oauth/token`, `/oauth/revoke` (raiz, fora de `/api/v1`) | cliente OAuth |
| GET | `/api-docs`, `/api-docs/openapi.json` | documentação OpenAPI |

## Acessibilidade
Os clientes React e Vue incluem temas claro/escuro persistentes (inicializados pela preferência do sistema), controle de tema também disponível na tela de login, navegação por teclado, link para pular ao conteúdo, rótulos associados aos campos, foco visível, erros/notificações anunciados por leitores de tela, redução de movimento e tabelas alternativas para os gráficos/mapa. As permissões são verificadas no backend em cada operação; a navegação dos clientes apenas reflete essas permissões para a experiência do usuário. A interface Handlebars original também continua disponível em `/dashboard`.

## Estrutura
```
migrations/  001 users · 002 esg · 003 leontief · 004 ledger · 005 notifications · 006 oauth
seeders/     001-admin (gerente) · 002-demo-data (SEED_DEMO=true)
python/      app.py (Flask + NumPy), requirements.txt, Dockerfile
clients/     react/ e vue/ (componentes, telas, API e estilos separados)
             shared/ tema, estilos, relatórios e lógica de simulação
src/         models · controllers · services · validators · middlewares · routes
             views (layouts, partials, páginas .hbs) · public (css, js, bundles React/Vue)
```

## Observações e limitações
- **ROI:** o simulador do `index.html` fixava 3 anos e, com os limites dos controles (eficiência total ≤ 49%), `economia × 3` nunca superava o investimento: o ROI ficava sempre em 0%. Aqui há um **horizonte em anos** ajustável e o ROI pode ser negativo. As constantes (0,3/0,4/0,3 e 50%) continuam as do protótipo original e **não são validadas**.
- **Ledger:** registro encadeado em banco relacional; detecta adulteração, **não é blockchain distribuída**.
- **JWT** é *stateless*: trocar a senha não invalida tokens já emitidos (expiram em `JWT_EXPIRES_IN`).
- O limitador de tentativas é em memória, por processo (em várias réplicas, use um armazenamento compartilhado).
- Não incluído: envio de e-mail, login social, testes automatizados Jest.
