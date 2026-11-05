# 📄 Especificação e Documentação Técnica Completa: Girô v1.0
## Sistema Inteligente de Gestão Orçamentária e Operacional para Motoristas de Aplicativo

---

## Sumário Executivo e Metadados do Projeto

- **Produto:** Girô (Plataforma Fullstack de Gestão Financeira e Operacional)
- **Versão:** 1.0.0 (Fase 1 — Fundação Consolidada com Isolamento Multi-Tenancy)
- **Ambiente Operacional:** Web & Mobile PWA (Progressive Web Application)
- **Repositório do Código:** `C:\Users\glauc\Desktop\Nova pasta\giro`
- **Data da Emissão:** Outubro de 2026
- **Status do Ciclo de Vida:** Fundação Completa (Pronto para Homologação e Evolução)

---

## 1. Visão Geral do Sistema e Objetivos de Negócio

### 1.1 Objetivo do Documento
Este documento formaliza a arquitetura, engenharia de software, especificação de requisitos e modelo de dados do ecossistema **Girô**. Ele serve como fonte única da verdade (Single Source of Truth - SSOT) para desenvolvedores, arquitetos, auditores e partes interessadas no ciclo de vida do produto.

### 1.2 Composição da Equipe e Governança do Projeto
- **Autor / Engenheiro Líder:** Glaucio Luiz Cavalcanti (Análise e Desenvolvimento de Sistemas)
- **Metodologia de Gestão:** Ágil Orientada a Recursos (Feature-Driven Development - FDD) com Princípios de Clean Architecture e Clean Code.
- **Padrão de Qualidade:** Código estritamente tipado (TypeScript no frontend e backend), isolamento de dados com modelo multi-tenancy, validação de entradas por esquemas canônicos (Zod) e persistência isolada via Repository Pattern.

### 1.3 Introdução do Projeto e Conceito do Produto
Motoristas que utilizam plataformas de transporte remunerado privado (Uber, 99, inDrive) operam como microempreendedores individuais desprovidos de ferramentas financeiras sob medida. Tradicionalmente, o controle financeiro é executado por blocos de notas manuscritos ou planilhas Excel desvinculadas da operação em campo. 

O **Girô** nasce para preencher essa lacuna, integrando:
1. Controle de despesas operacionais fixas e parceladas (aluguel, acordos, mensalidades, assinaturas);
2. Acompanhamento diário de quilometragem e múltiplos combustíveis (gasolina, etanol ou ambos);
3. Gestão de passivos veiculares (cotas de IPVA, taxas e multas);
4. Consolidação mensal e anual interativa em tempo real (Recharts + TanStack Query), sem necessidade de recarregamento manual de página.

### 1.4 Missão do Produto
> *"Empoderar o motorista autônomo com inteligência de dados, clareza sobre o custo real por quilômetro rodado e controle financeiro definitivo para transformar esforço operacional em lucro real e sustentável."*

### 1.5 Justificativa Técnica e Impacto de Negócio
- **Problema:** Sensação ilusória de faturamento bruto alto, mascarando despesas recorrentes e alto desgaste veicular.
- **Solução Girô:** Automação do cálculo de margem líquida real ($$\text{Saldo Líquido} = \text{Receita Bruta} - \text{Combustível} - \text{Despesas Fixas e Variáveis}$$), eliminando retrabalho manual em planilhas e permitindo tomadas de decisão imediatas sobre qual combustível utilizar e se as metas da semana foram atingidas.

### 1.6 Naming e Identidade Visual
O nome **Girô** possui duplo significado estratégico:
- **Giro Operacional:** Rodar na rua, fazer corridas, movimentar o veículo.
- **Giro Financeiro:** Fluxo de caixa diário, liquidez e saúde monetária.
- A acentuação circunflexa ("ô") remete tanto a um volante automotivo quanto a uma moeda em circulação.

---

## 2. Engenharia de Requisitos, Viewpoints e Stakeholders

### 2.1 Mapeamento de Viewpoints e Atores

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MAPEAMENTO DE STAKEHOLDERS                            │
├─────────────────────────┬───────────────────────┬───────────────────────────┤
│ Ator / Stakeholder      │ Tipo de Interesse     │ Papel no Ecossistema      │
├─────────────────────────┼───────────────────────┼───────────────────────────┤
│ Motorista Autônomo      │ Usuário Final         │ Lança corridas, abastece, │
│                         │                       │ controla contas e IPVA    │
├─────────────────────────┼───────────────────────┼───────────────────────────┤
│ Gestor / Mantenedor     │ Operação & DevOps     │ Monitora banco de dados,  │
│                         │                       │ segurança e estabilidade  │
├─────────────────────────┼───────────────────────┼───────────────────────────┤
│ Família do Motorista    │ Beneficiário Indireto │ Dependente do orçamento e │
│                         │                       │ estabilidade financeira   │
└─────────────────────────┴───────────────────────┴───────────────────────────┘
```

#### 2.1.1 Persona Primária: Carlos Silva ("Carlos Motorista")
- **Idade:** 38 anos
- **Ocupação:** Motorista de aplicativo em tempo integral (Recife - PE)
- **Veículo:** Sedan 1.0 flex financiado (parcela de R$ 851,15/mês)
- **Rotina:** 10 a 12 horas diárias no trânsito; abastece até duas vezes ao dia.
- **Dores:** Perdia horas na semana digitando notas fiscais numa planilha complexa; não sabia exatamente o custo do KM rodado; sofria com a surpresa de parcelas atrasadas do IPVA e aluguel.
- **Necessidade no Girô:** Interface limpa no celular, rápida de abrir, onde possa lançar KM e combustível em menos de 30 segundos ao final do turno e visualizar na hora se sobrou dinheiro no mês.

### 2.2 Escopo do Produto

#### In-Scope (Fase 1 Implementada)
- [x] Autenticação segura via JWT com criptografia bcrypt de senhas.
- [x] Isolamento absoluto de contas (multi-tenancy por `userId`).
- [x] Contas novas inicializadas totalmente zeradas e sem ruído de dados.
- [x] Preservação de dados históricos do usuário legado (planilha de 2026).
- [x] Painel de bordo anual reativo (12 meses com receitas, combustível, contas e saldo).
- [x] Navegador temporal completo por Ano (`2025`, `2026`, `2027`...) e Mês (`Jan` a `Dez`).
- [x] Módulo diário de KM rodado e múltiplos combustíveis (Gasolina, Etanol ou Ambos).
- [x] Módulo de gestão de contas e compromissos fixos, variáveis e parcelados com baixa interativa.
- [x] Módulo de veículo e passivos veiculares (IPVA, Licenciamento, Bombeiros e Multas de trânsito).
- [x] Design responsivo universal (Mobile First, tablets e monitores desktop).

#### Out-of-Scope (Fases Futuras)
- [ ] Integração via OCR de cupons fiscais de postos de gasolina.
- [ ] Conexão direta com APIs proprietárias de Uber e 99 (restringido por termos de uso de terceiros).
- [ ] Integração direta com gateway bancário para pagamento de boletos de IPVA direto no app.

### 2.3 Siglas e Definições Técnicas
- **JWT (JSON Web Token):** Padrão aberto (RFC 7519) para transmissão compacta e segura de dados autenticados.
- **BRL:** Moeda oficial brasileira (Real - R$).
- **KM/L:** Métrica de eficiência de consumo (Quilômetros rodados por litro).
- **R$/KM:** Custo monetário de combustível por quilômetro rodado.
- **PWA:** Progressive Web Application, tecnologia que permite instalar o site como app nativo no smartphone.
- **ACID:** Propriedades de transação de banco de dados (Atomicidade, Consistência, Isolamento, Durabilidade).

### 2.4 Indicadores-Chave de Desempenho (KPIs do Produto)
1. **Tempo de Registro Diário:** Inferior a 40 segundos por lançamento.
2. **Tempo de Resposta dos Endpoints:** < 100ms para consultas locais.
3. **Assertividade no Cálculo de Saldo:** 100% de precisão contábil entre receitas, custos e passivos.
4. **Disponibilidade Operacional:** Zero falhas de concorrência ou colisão entre usuários.

---

## 3. Requisitos do Sistema

### 3.1 Requisitos Não-Funcionais (RNFs)

- **RNF01 (Segurança de Dados e Isolamento):** Nenhum usuário pode visualizar, alterar ou excluir registros pertencentes a outro `userId`. Todas as rotas privadas validam o token Bearer no cabeçalho.
- **RNF02 (Criptografia de Senhas):** Senhas nunca são persistidas em texto plano. Utiliza-se algoritmo de derivação com salt via `bcryptjs` com fator de trabalho 10.
- **RNF03 (Tempo de Resposta e Performance):** Gráficos e cards devem re-renderizar em menos de 300ms através de invalidação cirúrgica de cache pelo TanStack Query, sem refresh da página (Zero F5).
- **RNF04 (Responsividade Universal):** A interface deve manter total legibilidade e operação em resoluções de 360px (smartphones de entrada) até 3840px (monitores 4K).
- **RNF05 (Integridade e Persistência):** Utilização de constraints relacionais no banco de dados (`FOREIGN KEY`, exclusão em cascata em abastecimentos e índices compostos `userId + year + month`).
- **RNF06 (Proteção contra Abuso):** A API Fastify aplica rate limiting de até 300 requisições por minuto por IP para mitigar ataques de negação de serviço ou brute-force.
- **RNF07 (Disponibilidade e Portabilidade):** O banco de dados relacional utiliza Prisma ORM permitindo chaveamento transparente entre SQLite e PostgreSQL sem quebra da camada de serviços.

### 3.2 Requisitos Funcionais (RFs) Detalhados

#### Módulo de Autenticação (`auth`)
- **RF01 - Cadastro de Usuário:** O sistema deve permitir criar novas contas com Nome, E-mail e Senha.
  - *Regra:* E-mail único no sistema; senha mínima de 6 caracteres.
- **RF02 - Login com Emissão de Token:** O sistema deve autenticar credenciais e retornar um token JWT com validade configurada.
- **RF03 - Proteção de Sessão e Logout:** A interface deve redirecionar usuários deslogados para a tela de autenticação e limpar os dados de cache na saída.

#### Módulo de Operação Diária & Combustível (`fuel-log`)
- **RF04 - Registro de Dia de Trabalho:** O motorista deve informar Data, KM Inicial, KM Final, Ganho Bruto e Observações opcionais.
  - *Regra:* O KM Total deve ser calculado automaticamente ($$\text{KM Final} - \text{KM Inicial} \ge 0$$).
- **RF05 - Múltiplos Abastecimentos por Dia:** O sistema deve permitir abastecer Gasolina, Etanol ou ambos no mesmo registro, especificando litros e preço por litro.
  - *Regra:* O valor total de combustível deve somar cada combustível automaticamente e deduzir do saldo do mês.

#### Módulo de Gestão de Contas e Compromissos (`expenses`)
- **RF06 - Cadastro Flexível de Despesas:** O usuário pode adicionar qualquer compromisso (Aluguel, Energia, Mercado, Financiamento, Assinaturas).
  - *Regra:* Suporte a dia de vencimento e parcelamento textual (ex: "01/21", "05/12").
- **RF07 - Baixa Interativa de Pagamentos:** O usuário pode marcar ou desmarcar contas como pagas clicando no indicador de status.
- **RF08 - Exclusão de Compromissos:** O usuário pode deletar contas com recálculo instantâneo do saldo líquido do mês.

#### Módulo de Veículo & Tributos (`vehicle`)
- **RF09 - Controle de Informações do Veículo:** O usuário pode editar Modelo, Placa, Financiamento Mensal e Seguro do carro.
- **RF10 - Gestão de Cotas de IPVA e Taxas:** O sistema deve exibir as 10 cotas de IPVA, taxas de bombeiros e licenciamento.
- **RF11 - Lançamento de Multas e Débitos Extras:** O motorista pode lançar multas de trânsito ou custos inesperados, informando valor, data de vencimento e cota.
- **RF12 - Baixa e Exclusão de Débitos:** O usuário pode alternar o status de pagamento de cada cota/multa ou excluí-la.

#### Módulo de Consolidação & Dashboard (`dashboard`)
- **RF13 - Gráfico Anual Interativo em Tempo Real:** Exibição dos 12 meses do ano com barras de Receita, Combustível e Contas, e linha de Saldo Líquido.
- **RF14 - Navegação Multi-Ano:** O motorista pode retroceder a anos anteriores ou avançar a anos futuros preservando os dados históricos.
- **RF15 - Visão Mensal Detalhada:** Exibição agrupada de ganhos semanais e histórico detalhado de dias rodados.

---

## 4. Arquitetura de Software e Engenharia

### 4.1 Padrão de Arquitetura em Camadas
A aplicação adota uma arquitetura em camadas orientada a domínio (Feature-Driven / Vertical Slice):

1. **Apresentação (Frontend):** Componentes funcionais React 19 estilizados com Tailwind CSS e Recharts.
2. **Orquestração de Estado e Rede:** Context API para sessão e TanStack Query para cache de dados.
3. **Controladores e Roteamento (Backend Fastify):** Handlers responsáveis por validar requisições com Zod e responder JSON padronizado.
4. **Camada de Serviço (Domain Services):** Contém as regras de negócio de cálculo de saldos e autenticação.
5. **Camada de Repositório (Data Access Layer):** Isola chamadas do ORM Prisma das regras de negócio.
6. **Camada de Persistência:** SQLite / PostgreSQL com transações atômicas.

### 4.2 Topologia Modular de Diretórios
```
📁 giro/
  📁 docs/                     # Especificação, diagramas e contratos
  📁 prisma/                   # Schema relacional e banco SQLite (dev.db)
  📁 src/
    📁 core/                   # Infraestrutura global e imutável por feature
      📁 config/               # Variáveis de ambiente e constantes
      📁 database/             # Instância do Prisma Client e seeds
      📁 theme/                # Design tokens e css global
      📁 utils/                # Utilitário apiFetch e helpers de cálculo
    📁 modules/                # Módulos de negócio independentes
      📁 auth/                 # Login, registro, JWT e hook useAuth
      📁 dashboard/            # Visão geral, gráficos anuais e consolidação
      📁 fuel-log/             # Registro diário de KM e combustível
      📁 expenses/             # Contas a pagar e despesas operacionais
      📁 vehicle/              # Veículo, IPVA, taxas e multas
    📁 shared/                 # Componentes compartilhados (Sidebar, Header, Layout)
    📁 server/                 # Bootstrap da API Fastify (main.ts)
    📄 main.tsx                # Bootstrap da UI React
```

---

## 5. Modelo de Dados e Dicionário do Banco de Dados

### 5.1 Dicionário de Tabelas

#### Tabela `users`
Armazena a identidade dos motoristas cadastrados.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `name` | TEXT | NÃO | Nome completo do motorista |
| `email` | TEXT | NÃO | E-mail corporativo/pessoal (Único) |
| `passwordHash` | TEXT | NÃO | Hash bcrypt da senha |
| `createdAt` | DATETIME | NÃO | Carimbo de data/hora de criação |
| `updatedAt` | DATETIME | NÃO | Carimbo de data/hora da última alteração |

#### Tabela `vehicles`
Representa os veículos cadastrados por cada motorista.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `userId` | TEXT (FK) | NÃO | Vínculo com `users.id` |
| `plate` | TEXT | NÃO | Placa identificadora do automóvel |
| `brand` | TEXT | NÃO | Marca do veículo (ex: Fiat, Chevrolet) |
| `model` | TEXT | NÃO | Modelo descritivo |
| `year` | INTEGER | NÃO | Ano de fabricação/modelo |
| `monthlyInstallment` | REAL | NÃO | Parcela mensal do financiamento (R$) |
| `insuranceValue` | REAL | NÃO | Valor do seguro/rastreador (R$) |

#### Tabela `vehicle_taxes`
Gerencia passivos, cotas de IPVA, bombeiros, licenciamento e multas.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `vehicleId` | TEXT (FK) | NÃO | Vínculo com `vehicles.id` |
| `taxType` | TEXT | NÃO | Tipo (IPVA, MULTA, LICENCIAMENTO, BOMBEIROS) |
| `fiscalYear` | INTEGER | NÃO | Ano do exercício tributário |
| `installmentNumber` | INTEGER | NÃO | Número da cota (ex: 1 até 10) |
| `totalInstallments` | INTEGER | NÃO | Total de cotas da obrigação |
| `dueDate` | DATETIME | NÃO | Data de vencimento |
| `amount` | REAL | NÃO | Valor devido (R$) |
| `isPaid` | BOOLEAN | NÃO | Booleano indicando quitação |

#### Tabela `budget_months`
Consolidado financeiro mensal do motorista.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `userId` | TEXT (FK) | NÃO | Vínculo com `users.id` |
| `year` | INTEGER | NÃO | Ano de referência (ex: 2026) |
| `month` | INTEGER | NÃO | Mês de referência (1 a 12) |
| `status` | TEXT | NÃO | Status ("OPEN" ou "CLOSED") |
| `totalRevenue` | REAL | NÃO | Faturamento bruto acumulado (R$) |
| `totalFuelCost` | REAL | NÃO | Custo total de combustível (R$) |
| `totalExpenses` | REAL | NÃO | Somatório de contas e despesas (R$) |
| `netBalance` | REAL | NÃO | Saldo líquido real resultante (R$) |

#### Tabela `daily_work_logs`
Registros diários da operação na rua.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `budgetMonthId` | TEXT (FK) | NÃO | Vínculo com `budget_months.id` |
| `workDate` | DATETIME | NÃO | Data do turno |
| `kmStart` | REAL | NÃO | Odômetro no início do dia |
| `kmEnd` | REAL | NÃO | Odômetro no final do dia |
| `totalKm` | REAL | NÃO | Diferença computada de quilômetros rodados |
| `grossEarning` | REAL | NÃO | Ganho bruto apurado no dia |
| `notes` | TEXT | SIM | Observações sobre o turno |

#### Tabela `fuel_entries`
Abastecimentos individuais associados ao dia de trabalho.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `dailyWorkLogId` | TEXT (FK) | NÃO | Vínculo com `daily_work_logs.id` (Cascade) |
| `fuelType` | TEXT | NÃO | Tipo do combustível ("GASOLINE" ou "ETHANOL") |
| `liters` | REAL | NÃO | Quantidade de litros abastecidos |
| `pricePerLiter` | REAL | NÃO | Preço unitário pago pelo combustível |
| `totalCost` | REAL | NÃO | Custo total calculado ($$\text{liters} \times \text{pricePerLiter}$$) |

#### Tabela `expenses`
Compromissos fixos, variáveis, contas de consumo e acordos financeiros.
| Coluna | Tipo | Nulo? | Descrição |
|---|---|---|---|
| `id` | TEXT (UUID) | NÃO | Chave primária única |
| `budgetMonthId` | TEXT (FK) | NÃO | Vínculo com `budget_months.id` |
| `category` | TEXT | NÃO | Categoria de despesa |
| `description` | TEXT | NÃO | Descrição textual da conta |
| `plannedAmount` | REAL | NÃO | Valor planejado/orçado |
| `actualAmount` | REAL | NÃO | Valor real apurado/pago |
| `isPaid` | BOOLEAN | NÃO | Booleano de quitação |
| `installment` | TEXT | SIM | Identificador de parcela (ex: "05/12") |
| `dueDay` | INTEGER | SIM | Dia do vencimento no mês |

---

## 6. Catálogo de Endpoints e Contratos da API REST

Todas as rotas sob o prefixo `/api/*` (exceto `/api/auth/*`) exigem o cabeçalho:
```http
Authorization: Bearer <TOKEN_JWT>
```

### 6.1 Módulo Autenticação

#### `POST /api/auth/register`
Cadastra um novo usuário e devolve token de sessão.
- **Request Body:**
```json
{
  "name": "Carlos Motorista",
  "email": "carlos@giro.app",
  "password": "senha123456"
}
```
- **Response (201 Created):**
```json
{
  "user": {
    "id": "bba8ed83-80b8-4c7b-8332-261b834bc7e4",
    "email": "carlos@giro.app",
    "name": "Carlos Motorista"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

#### `POST /api/auth/login`
Autentica e emite novo token.
- **Request Body:**
```json
{
  "email": "carlos@giro.app",
  "password": "senha123456"
}
```
- **Response (200 OK):**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "token": "..."
}
```

#### `GET /api/auth/me`
Retorna os dados do usuário autenticado a partir do token.
- **Response (200 OK):**
```json
{
  "user": {
    "id": "bba8ed83-80b8-4c7b-8332-261b834bc7e4",
    "email": "carlos@giro.app",
    "name": "Carlos Motorista"
  }
}
```

---

### 6.2 Módulo Dashboard & Consolidação

#### `GET /api/years`
Retorna a lista de anos com orçamentos registrados para o usuário logado.
- **Response (200 OK):**
```json
{ "years": [2026, 2025] }
```

#### `GET /api/dashboard/annual-summary?year=2026`
Retorna os 12 meses consolidados do ano do usuário autenticado.
- **Response (200 OK):**
```json
{
  "year": 2026,
  "monthlyData": [
    { "month": 1, "monthName": "Jan", "revenue": 7118.75, "fuelCost": 2939.4, "expenses": 4748.91, "netBalance": 4179.35 },
    { "month": 2, "monthName": "Fev", "revenue": 7531.6, "fuelCost": 2699.83, "expenses": 7202.5, "netBalance": -393.26 }
  ],
  "totals": {
    "revenue": 31322.57,
    "fuelCost": 12046.11,
    "expenses": 24485.57,
    "netBalance": 6312.29
  }
}
```

#### `GET /api/dashboard/monthly-detail?year=2026&month=7`
Retorna despesas, semanas e lançamentos diários do mês específico.

---

### 6.3 Módulo Diário de KM e Combustível

#### `POST /api/fuel-log/daily`
Registra o turno de trabalho e atualiza instantaneamente o orçamento mensal.
- **Request Body:**
```json
{
  "year": 2026,
  "month": 7,
  "workDate": "2026-07-01",
  "kmStart": 54120,
  "kmEnd": 54340,
  "grossEarning": 410.50,
  "notes": "Dia chuvoso, bom movimento",
  "fuelEntries": [
    {
      "fuelType": "GASOLINE",
      "liters": 25.0,
      "pricePerLiter": 5.89
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "dailyLog": {
    "id": "...",
    "totalKm": 220,
    "grossEarning": 410.50,
    "fuelEntries": [ { "id": "...", "totalCost": 147.25 } ]
  }
}
```

---

### 6.4 Módulo Despesas & Compromissos

#### `POST /api/expenses`
Cadastra uma nova conta no orçamento mensal.
- **Request Body:**
```json
{
  "year": 2026,
  "month": 7,
  "category": "HOUSING",
  "description": "Aluguel",
  "plannedAmount": 670.00,
  "actualAmount": 670.00,
  "dueDay": 30,
  "installment": "01/21"
}
```

#### `PATCH /api/expenses/:id`
Alterna o status de quitação ou altera o valor de uma despesa pertencente ao usuário.
- **Request Body:**
```json
{ "isPaid": true }
```

#### `DELETE /api/expenses/:id`
Exclui a despesa e recalcula o saldo resultante do mês.

---

### 6.5 Módulo Veículo & Débitos Tributários

#### `GET /api/vehicle`
Retorna as configurações do automóvel e a lista de débitos veiculares (IPVA, taxas, multas) do usuário logado.

#### `PATCH /api/vehicle`
Atualiza placa, modelo, parcela ou seguro do carro.

#### `POST /api/vehicle/taxes`
Registra novo débito, IPVA ou multa de trânsito.
- **Request Body:**
```json
{
  "taxType": "MULTA",
  "amount": 195.23,
  "dueDate": "2026-09-10",
  "fiscalYear": 2026,
  "installmentNumber": 1,
  "totalInstallments": 1,
  "isPaid": false
}
```

#### `PATCH /api/vehicle/taxes/:id`
Alterna quitação da cota ou multa.

#### `DELETE /api/vehicle/taxes/:id`
Exclui débito veicular associado ao usuário.

---

## 7. Procedimentos de Instalação, Execução e Testes

### 7.1 Pré-Requisitos de Ambiente
- Node.js versão 20 ou superior (verificado: v24.16.0)
- Gerenciador de pacotes npm (v11+)
- Sistema Operacional: Windows 10/11 ou Linux/macOS

### 7.2 Instalação e Execução Local
Na raiz do repositório (`C:\Users\glauc\Desktop\Nova pasta\giro`):

```bash
# 1. Instalar dependências
npm install

# 2. Sincronizar banco de dados relacional
npx prisma db push

# 3. Executar o servidor backend API (Porta 3333)
npm run dev:server

# 4. Executar o servidor de desenvolvimento do Frontend (Porta 5173)
npm run dev:web
```

### 7.3 Execução da Bateria de Testes de Isolamento (E2E)
Para verificar a segurança de isolamento multi-usuário e regras de acesso:

```bash
npx tsx tests/isolation.e2e.ts
```

---

## 8. Considerações Finais e Próximos Passos (Fase 2)

A **Fase 1 (Fundação)** atinge neste ponto o estado de completude máxima:
- Persistência e regras de negócio blindadas contra vazamentos de dados entre motoristas.
- Módulos desacoplados seguindo rigorosamente o princípio da responsabilidade única (SRP).
- Experiência de uso fluida com navegação temporal e recálculos instantâneos.

A base estabelecida encontra-se devidamente documentada e pronta para a recepção dos recursos avançados da **Fase 2 (Core do Negócio: automação de métricas avançadas de rendimento por litro, alertas de manutenção preventiva e exportação de relatórios contábeis)**.
