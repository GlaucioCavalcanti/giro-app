# 🚗 Girô — Gestão Orçamentária e Operacional Inteligente para Motoristas de APP

<p align="center">
  <img src="https://img.shields.io/badge/Status-Fase%201%20Conclu%C3%ADda-10b981?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%7C%20Fastify%20%7C%20Prisma-0284c7?style=for-the-badge&logo=typescript&logoColor=white" alt="Stack" />
  <img src="https://img.shields.io/badge/Security-Multi--Tenancy%20%26%20JWT-7c3aed?style=for-the-badge&logo=auth0&logoColor=white" alt="Security" />
  <img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Transformando o esforço no asfalto em métricas financeiras precisas, controle tributário e rentabilidade real.</strong>
</p>

---

## ⚡ Sobre o Girô

O **Girô** é uma plataforma fullstack concebida para atender à realidade operacional dos motoristas autônomos de aplicativos (Uber, 99, inDrive). 

Diferente de planilhas engessadas ou gerenciadores genéricos que ignoram a dinâmica da rua, o **Girô** unifica em uma única interface responsiva:
- **Gestão diária de hodômetro e múltiplos combustíveis** (Gasolina, Etanol ou ambos com cálculo dinâmico de custo por KM);
- **Orquestração financeira multi-ano e multi-mês** com dashboards interativos em tempo real;
- **Controle cirúrgico de compromissos fixos, variáveis e acordos parcelados** (aluguel, consórcio, parcelamentos com contadores inteligentes);
- **Acompanhamento de passivos veiculares** (IPVA em 10 cotas, taxas de licenciamento, corpo de bombeiros e multas de trânsito);
- **Isolamento estrito de dados (*Multi-Tenancy*)**, garantindo que cada novo motorista inicie com um ambiente 100% zerado e confidencial.

---

## 🏛️ Arquitetura em Camadas (Clean & Modular)

O projeto adota uma arquitetura orientada a domínios de negócio (*Feature-Driven / Vertical Slice Architecture*), com tipagem estrita de ponta a ponta e persistência desacoplada:

```
📁 giro/
├── 📁 assets/                # Documentos de apoio e diagramas originais
├── 📁 docs/                  # Especificação técnica formal e diagramas Mermaid
│   ├── 📄 DOCUMENTACAO_TECNICA_COMPLETA_GIRO.md
│   ├── 📄 DIAGRAMAS_E_ORGANOGRAMAS.md
│   ├── 📄 architecture.md
│   └── 📄 Especificacao_e_Documentacao_Tecnica_Giro_V1.docx
├── 📁 prisma/                # Camada relacional e modelagem de schema
│   └── 📄 schema.prisma
├── 📁 scripts/               # Scripts de seed, migração e automação
├── 📁 src/
│   ├── 📁 core/              # Camada global e infraestrutura imutável
│   │   ├── 📁 config/        # Variáveis de ambiente e constantes
│   │   ├── 📁 database/      # Singleton do Prisma ORM e seeds
│   │   ├── 📁 theme/         # Design System dark e diretivas Tailwind v4
│   │   └── 📁 utils/         # Cliente HTTP centralizado (apiFetch com Bearer token)
│   ├── 📁 modules/           # Domínios isolados de negócio (SRP)
│   │   ├── 📁 auth/          # Autenticação JWT, bcryptjs, rotas e hook useAuth
│   │   ├── 📁 budgeting/     # Orquestração do orçamento mensal e metas
│   │   ├── 📁 dashboard/     # Dashboards anuais/mensais e gráficos Recharts
│   │   ├── 📁 earnings/      # Fechamento de semanas e ganhos brutos
│   │   ├── 📁 expenses/      # Contas a pagar, baixas interativas e parcelas
│   │   ├── 📁 fuel-log/      # Registros de turno, KM inicial/final e litros
│   │   └── 📁 vehicle/       # Gestão do carro, cotas de IPVA, taxas e multas
│   ├── 📁 shared/            # Layout responsivo, Sidebar modular e Header dinâmico
│   └── 📁 server/            # API REST de alta performance em Fastify
└── 📁 tests/                 # Bateria de testes E2E e validação de isolamento
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** + **Vite 8** (bundling ultrarrápido e arquitetura moderna de componentes);
- **TypeScript** em modo estrito (`strict: true`), prevenindo regressões de tipos;
- **Tailwind CSS v4** com paleta Dark Mode pensada para ergonomia visual diurna/noturna;
- **TanStack Query (React Query v5)** para cache em memória, invalidação cirúrgica e reatividade instantânea;
- **Recharts** para renderização de gráficos combinados (Barras + Linhas de tendência);
- **Lucide Icons** para iconografia limpa e intuitiva.

### Backend & Segurança
- **Node.js** + **Fastify v5** (baixo overhead de memória e taxa de transferência elevada);
- **Prisma ORM 5.22** (modelagem tipada com migrations e integridade referencial);
- **PostgreSQL / SQLite** (compatibilidade nativa e transações ACID);
- **JWT (`@fastify/jwt`)** + **bcryptjs** (hashing irreversível com salt factor 10);
- **Fastify Rate Limit** (mitigação ativa contra brute-force e abusos de requisição);
- **Zod v4** (validação canônica de entrada em todos os endpoints da API).

---

## 🚀 Principais Funcionalidades

### 1. Painel Anual e Mensal em Tempo Real
- Gráfico composto anual (12 meses) que recalcula automaticamente receitas, combustível, contas e a linha de saldo líquido no ato de cada lançamento (zero recarregamento de página);
- Navegação histórica fluida por anos (`2025`, `2026`, `2027`...) e detalhamento mensal em semanas apuradas.

### 2. Controle Operacional Diário (KM & Combustível)
- Registro de KM Inicial, KM Final e cálculo automático da rodagem do dia;
- Seleção de abastecimento flexível: **Gasolina**, **Etanol** ou **Ambos**, informando litragem, preço unitário e valor total consolidado;
- Cômputo imediato do custo operacional que alimenta o balanço do mês.

### 3. Gestão de Contas, Despesas e Compromissos
- CRUD flexível para contas de consumo (energia, internet, mercado, escola, assinaturas);
- Controle de parcelamentos recorrentes (ex: *Acordo Aluguel 01/21*, *COF Nubank 06/12*);
- Baixa interativa com alternância visual imediata entre "A Pagar" e "Pago".

### 4. Gestão de Veículo, IPVA & Multas
- Monitoramento detalhado das cotas de IPVA (1 a 10), taxa de bombeiros e licenciamento anual;
- Lançamento e quitação de multas de trânsito inesperadas e custos extras de oficina;
- Atualização em tempo real de passivos pendentes versus quitados.

### 5. Multi-Tenancy e Isolamento de Dados
- Guarda global de autorização via Bearer Token;
- Qualquer novo cadastro acessa uma área **100% zerada**, sem dados residuais de outros usuários;
- Proteção ativa contra leitura, edição ou exclusão cruzada de registros.

---

## 💻 Como Executar Localmente

### Pré-requisitos
- **Node.js** v20.x ou superior (testado em v24.16);
- **npm** v10.x ou superior.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GlaucioCavalcanti/giro-app.git
   cd giro-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```

4. **Sincronize o banco de dados:**
   ```bash
   npx prisma db push
   ```

5. **(Opcional) Popule o banco com dados de teste e histórico:**
   ```bash
   npm run db:seed
   ```
   > *Gera o usuário legado com histórico da planilha de 2026: `carlos@giro.app` / `senha123456`.*

6. **Inicie o ecossistema:**

   - **Terminal 1 — Backend API (Porta 3333):**
     ```bash
     npm run dev:server
     ```

   - **Terminal 2 — Frontend UI (Porta 5173):**
     ```bash
     npm run dev:web
     ```

7. **Acesse no navegador:**
   - Interface Web / PWA: [http://localhost:5173](http://localhost:5173)
   - API REST: `http://localhost:3333`

---

## 🧪 Bateria de Testes Automatizados

Para validar o isolamento estrito de dados entre usuários e a inviolabilidade das rotas privadas:

```bash
npx tsx tests/isolation.e2e.ts
```

---

## 📚 Documentação Técnica Completa

Para aprofundamento em diagramas UML, modelagem de banco de dados física, dicionário de tabelas, personas e especificação formal de requisitos, consulte a pasta [`docs/`](./docs):
- [Documentação Técnica Completa (Markdown)](./docs/DOCUMENTACAO_TECNICA_COMPLETA_GIRO.md)
- [Diagramas e Organogramas Mermaid](./docs/DIAGRAMAS_E_ORGANOGRAMAS.md)
- [Especificação Técnica Completa (Word .docx)](./docs/Especificacao_e_Documentacao_Tecnica_Giro_V1.docx)

---

## 👨‍💻 Autor

**Glaucio Luiz Cavalcanti**  
*Análise e Desenvolvimento de Sistemas*  
GitHub: [@GlaucioCavalcanti](https://github.com/GlaucioCavalcanti)

---

<p align="center">
  Desenvolvido com foco em engenharia de precisão e empoderamento financeiro de motoristas autônomos.
</p>
