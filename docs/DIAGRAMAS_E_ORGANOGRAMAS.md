# 📐 Diagramas e Organogramas Técnicos — Girô (v1.0)

Este documento compila todos os diagramas visuais e organogramas de engenharia da plataforma **Girô**, modelados em sintaxe Mermaid para renderização nativa em visualizadores Markdown, GitHub e ferramentas de documentação.

---

## 1. Diagrama de Arquitetura em Camadas (Visão Tecnológica)

```mermaid
graph TD
    subgraph ClientLayer["Camada de Apresentação (Frontend / Client Layer)"]
        UI["React 19 + TypeScript (Strict Mode)"]
        Style["Tailwind CSS + Lucide Icons (Design Tokens Dark)"]
        Charts["Recharts (Gráficos Reativos Anuais e Semanais)"]
        Query["TanStack Query (Cache, Invalidação & Sincronização)"]
        State["Context API (AuthContext + useAuth)"]
    end

    subgraph GatewayLayer["Camada de Gateway & Segurança"]
        ViteProxy["Vite Reverse Proxy (/api -> :3333)"]
        RateLimit["Fastify Rate Limiting (300 req/min)"]
        Cors["CORS Configuration (Origins Whitelist)"]
        JWTVerify["JWT Authentication Guard (Bearer Token preHandler)"]
    end

    subgraph ServiceLayer["Camada de Domínio & Regras de Negócio (API Fastify)"]
        AuthMod["Módulo Auth (AuthService + bcryptjs)"]
        DashMod["Módulo Dashboard (Consolidação Anual / Mensal)"]
        FuelMod["Módulo Fuel-Log (KM, Eficiência & Combustíveis)"]
        ExpMod["Módulo Expenses (Contas, Parcelamentos & Baixas)"]
        VehMod["Módulo Vehicle (IPVA, Licenciamento & Multas)"]
    end

    subgraph DataAccessLayer["Camada de Acesso a Dados (Repository Pattern)"]
        PrismaORM["Prisma Client ORM (Singleton Instance)"]
        UserRepo["UserRepository (Operações de Usuário)"]
        BudgetRepo["Budget Queries & Aggregations"]
        VehicleRepo["Vehicle & Taxes Data Access"]
    end

    subgraph PersistenceLayer["Camada de Persistência & Armazenamento"]
        SQLiteDB[("SQLite Engine (dev.db / Transações ACID)")]
        DiskStorage["Sistema de Arquivos Local (Logs & Seeds)"]
    end

    UI --> Query
    Query --> State
    UI --> Charts
    UI --> Style
    Query --> ViteProxy
    ViteProxy --> RateLimit
    RateLimit --> Cors
    Cors --> JWTVerify
    JWTVerify --> AuthMod
    JWTVerify --> DashMod
    JWTVerify --> FuelMod
    JWTVerify --> ExpMod
    JWTVerify --> VehMod

    AuthMod --> UserRepo
    DashMod --> BudgetRepo
    FuelMod --> BudgetRepo
    ExpMod --> BudgetRepo
    VehMod --> VehicleRepo

    UserRepo --> PrismaORM
    BudgetRepo --> PrismaORM
    VehicleRepo --> PrismaORM

    PrismaORM --> SQLiteDB
```

---

## 2. Diagrama de Casos de Uso (UML)

```mermaid
flowchart LR
    ActorMotorista(["👤 Motorista de APP\n(Usuário Principal)"])
    ActorSistema(["⚙️ Sistema Girô\n(Automação / Background)"])

    subgraph UC_Auth["Autenticação e Sessão"]
        UC01["UC01: Criar Conta de Usuário"]
        UC02["UC02: Realizar Login e Obter JWT"]
        UC03["UC03: Encerrar Sessão (Logout)"]
    end

    subgraph UC_Daily["Operação Diária & Combustível"]
        UC04["UC04: Registrar Dia de Trabalho"]
        UC05["UC05: Lançar Abastecimento (Gasolina/Etanol)"]
        UC06["UC06: Calcular Eficiência (KM Total e R$/KM)"]
    end

    subgraph UC_Expenses["Gestão Financeira e Contas"]
        UC07["UC07: Cadastrar Compromisso / Conta"]
        UC08["UC08: Alternar Status (Pago / A Pagar)"]
        UC09["UC09: Excluir Compromisso Quitado"]
    end

    subgraph UC_Vehicle["Veículo e Tributos"]
        UC10["UC10: Consultar Calendário de IPVA e Taxas"]
        UC11["UC11: Lançar Nova Multa / Débito Extra"]
        UC12["UC12: Dar Baixa em Cota Veicular"]
        UC13["UC13: Atualizar Dados do Veículo"]
    end

    subgraph UC_Dashboard["Análise e Decisão"]
        UC14["UC14: Analisar Gráfico Anual Reativo"]
        UC15["UC15: Navegar pelo Histórico (Meses e Anos)"]
        UC16["UC16: Recalcular Saldos Líquidos"]
    end

    ActorMotorista --> UC01
    ActorMotorista --> UC02
    ActorMotorista --> UC03
    ActorMotorista --> UC04
    ActorMotorista --> UC05
    ActorMotorista --> UC07
    ActorMotorista --> UC08
    ActorMotorista --> UC09
    ActorMotorista --> UC10
    ActorMotorista --> UC11
    ActorMotorista --> UC12
    ActorMotorista --> UC13
    ActorMotorista --> UC14
    ActorMotorista --> UC15

    UC04 -.->|include| UC06
    UC04 -.->|trigger| UC16
    UC07 -.->|trigger| UC16
    UC08 -.->|trigger| UC16
    UC09 -.->|trigger| UC16
    ActorSistema --> UC16
```

---

## 3. Diagrama BPMN — Processo Atual (As-Is) vs. Processo Futuro (To-Be)

### 3.1 Processo Atual (As-Is: Planilha Manual e Caderno)

```mermaid
flowchart TD
    StartManual(["Início do Turno"]) --> RunTrips["Fazer Corridas nas Plataformas (Uber/99)"]
    RunTrips --> FuelManual["Abastecer no Posto (Guardar Recibo em Papel)"]
    FuelManual --> EndTurnManual["Fim do Turno: Anotar KM no Bloco de Notas/Painel"]
    EndTurnManual --> DelayWait["Fim de Semana / Dias Depois: Abrir Notebook"]
    DelayWait --> SheetInput["Digitar Manualmente Valores na Planilha Excel"]
    SheetInput --> SheetError{"Erro de Fórmula\nou Dado Faltando?"}
    SheetError -- Sim --> FixFormulas["Corrigir Fórmulas Manuais e Referências"]
    SheetError -- Não --> SheetCalc["Calcular Saldo Líquido Parcial"]
    FixFormulas --> SheetCalc
    SheetCalc --> RiskLoss["Risco de Desatualização e Falta de Decisão Imediata"]
    RiskLoss --> EndManual(["Término Ineficiente"])
```

### 3.2 Processo Futuro (To-Be: Ecossistema Girô em Tempo Real)

```mermaid
flowchart TD
    StartGiro(["Início do Turno"]) --> OpenGiro["Abrir Girô no Celular (PWA Mobile)"]
    OpenGiro --> FastLogin["Sessão Segura (JWT Automático)"]
    FastLogin --> WorkDay["Executar Corridas"]
    WorkDay --> FillLog["Posto / Final do Dia: Clique em '+ Registrar Dia / KM'"]
    FillLog --> QuickForm["Digitar KM Inicial, KM Final, Ganho e Combustível (Gas/Eta)"]
    QuickForm --> SubmitLog["Salvar Registro (1 Clique)"]
    SubmitLog --> AutoRecalc["Backend Fastify Recalcula Totais e Eficiência"]
    AutoRecalc --> ReactCache["TanStack Query Invalida Cache Cirurgicamente"]
    ReactCache --> RealtimeDash["Gráfico Anual, Mensal e Saldos Atualizados no Ato"]
    RealtimeDash --> SmartDecision["Motorista Visualiza Custo/KM e Lucro Real Instantâneo"]
    SmartDecision --> EndGiro(["Turno Consolidado sem Esforço"])
```

---

## 4. Diagrama de Sequência — Lançamento Diário e Atualização em Tempo Real

```mermaid
sequenceDiagram
    autonumber
    actor Motorista as 📱 Motorista de APP
    participant UI as 🖥️ Frontend (React / DashboardView)
    participant AuthContext as 🔐 Contexto de Autenticação
    participant API as 🛡️ API Fastify (:3333)
    participant AuthGuard as 👮 JWT Guard (preHandler)
    participant DB as 🐘 SQLite (Prisma ORM)
    participant QueryCache as 🔄 TanStack Query Cache

    Motorista->>UI: Clica em "+ Registrar Dia / KM"
    UI->>Motorista: Abre Modal de Registro com campos limpos
    Motorista->>UI: Preenche KM (54120 -> 54340), Ganho (R$ 380) e 20L Gasolina
    Motorista->>UI: Clica em "Salvar Registro"
    UI->>AuthContext: Recupera Bearer Token ativo
    UI->>API: POST /api/fuel-log/daily (Payload + Header Authorization)
    API->>AuthGuard: Valida Assinatura do Token e ID do Usuário
    AuthGuard-->>API: Usuário Válido e Isolado
    API->>DB: Busca ou Cria BudgetMonth(userId, year, month)
    API->>DB: INSERT daily_work_logs & fuel_entries
    API->>DB: SELECT SUM(ganhos), SUM(combustivel), SUM(despesas)
    API->>DB: UPDATE budget_months (Totais Recalculados)
    DB-->>API: Transação Confirmada
    API-->>UI: HTTP 201 Created (Log Cadastrado)
    UI->>QueryCache: InvalidateQueries(["annual-summary", year])
    UI->>QueryCache: InvalidateQueries(["monthly-detail", year, month])
    QueryCache->>API: GET /api/dashboard/annual-summary?year=2026
    API-->>QueryCache: Dados Atualizados dos 12 Meses
    QueryCache-->>UI: Cache Atualizado
    UI->>Motorista: Redesenha Barras e Curva de Saldo Líquido sem Reload (F5)
```

---

## 5. Diagrama de Classes de Domínio (Entidades de Negócio)

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String passwordHash
        +DateTime createdAt
        +DateTime updatedAt
        +register(data)
        +login(credentials)
        +validateToken()
    }

    class Vehicle {
        +String id
        +String userId
        +String plate
        +String brand
        +String model
        +Int year
        +Float monthlyInstallment
        +Float insuranceValue
        +updateDetails(data)
        +calculateTotalLiabilities()
    }

    class VehicleTax {
        +String id
        +String vehicleId
        +String taxType
        +Int fiscalYear
        +Int installmentNumber
        +Int totalInstallments
        +DateTime dueDate
        +Float amount
        +Boolean isPaid
        +toggleStatus()
    }

    class BudgetMonth {
        +String id
        +String userId
        +Int year
        +Int month
        +String status
        +Float totalRevenue
        +Float totalFuelCost
        +Float totalExpenses
        +Float netBalance
        +recalculateTotals()
    }

    class DailyWorkLog {
        +String id
        +String budgetMonthId
        +DateTime workDate
        +Float kmStart
        +Float kmEnd
        +Float totalKm
        +Float grossEarning
        +String notes
        +calculateKmDriven()
    }

    class FuelEntry {
        +String id
        +String dailyWorkLogId
        +String fuelType
        +Float liters
        +Float pricePerLiter
        +Float totalCost
        +calculateCost()
    }

    class Expense {
        +String id
        +String budgetMonthId
        +String category
        +String description
        +Float plannedAmount
        +Float actualAmount
        +Boolean isPaid
        +String installment
        +Int dueDay
        +togglePaid()
    }

    class WeeklyEarning {
        +String id
        +String budgetMonthId
        +Int weekNumber
        +Float grossAmount
        +Float fuelCost
        +Float netAmount
        +Float totalKm
    }

    User "1" --> "0..*" BudgetMonth : possui
    User "1" --> "0..*" Vehicle : gerencia
    Vehicle "1" --> "0..*" VehicleTax : incide
    BudgetMonth "1" --> "0..*" DailyWorkLog : registra
    BudgetMonth "1" --> "0..*" Expense : compromete
    BudgetMonth "1" --> "0..*" WeeklyEarning : consolida
    DailyWorkLog "1" --> "1..*" FuelEntry : compõe
```

---

## 6. Diagrama Entidade-Relacionamento (Modelo Físico de Dados)

```mermaid
erDiagram
    users ||--o{ budget_months : "possui (1:N)"
    users ||--o{ vehicles : "gerencia (1:N)"
    vehicles ||--o{ vehicle_taxes : "gera débitos (1:N)"
    vehicles ||--o{ vehicle_maintenances : "registra serviços (1:N)"
    budget_months ||--o{ daily_work_logs : "acumula dias (1:N)"
    budget_months ||--o{ weekly_earnings : "agrupa semanas (1:N)"
    budget_months ||--o{ expenses : "contém contas (1:N)"
    budget_months ||--o{ budget_goals : "estabelece metas (1:N)"
    daily_work_logs ||--o{ fuel_entries : "detalha abastecimento (1:N)"

    users {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT passwordHash
        DATETIME createdAt
        DATETIME updatedAt
    }

    vehicles {
        TEXT id PK
        TEXT userId FK
        TEXT plate UK
        TEXT brand
        TEXT model
        INTEGER year
        REAL monthlyInstallment
        REAL insuranceValue
        DATETIME createdAt
        DATETIME updatedAt
    }

    vehicle_taxes {
        TEXT id PK
        TEXT vehicleId FK
        TEXT taxType
        INTEGER fiscalYear
        INTEGER installmentNumber
        INTEGER totalInstallments
        DATETIME dueDate
        REAL amount
        BOOLEAN isPaid
        DATETIME createdAt
        DATETIME updatedAt
    }

    budget_months {
        TEXT id PK
        TEXT userId FK
        INTEGER year
        INTEGER month
        TEXT status
        REAL totalRevenue
        REAL totalFuelCost
        REAL totalExpenses
        REAL netBalance
        DATETIME createdAt
        DATETIME updatedAt
    }

    daily_work_logs {
        TEXT id PK
        TEXT budgetMonthId FK
        DATETIME workDate
        REAL kmStart
        REAL kmEnd
        REAL totalKm
        REAL grossEarning
        TEXT notes
        DATETIME createdAt
        DATETIME updatedAt
    }

    fuel_entries {
        TEXT id PK
        TEXT dailyWorkLogId FK
        TEXT fuelType
        REAL liters
        REAL pricePerLiter
        REAL totalCost
        DATETIME fueledAt
    }

    expenses {
        TEXT id PK
        TEXT budgetMonthId FK
        TEXT category
        TEXT description
        REAL plannedAmount
        REAL actualAmount
        BOOLEAN isPaid
        BOOLEAN isRecurring
        TEXT installment
        INTEGER dueDay
        DATETIME paidAt
        DATETIME createdAt
        DATETIME updatedAt
    }

    weekly_earnings {
        TEXT id PK
        TEXT budgetMonthId FK
        INTEGER weekNumber
        REAL grossAmount
        REAL fuelCost
        REAL netAmount
        REAL totalKm
        DATETIME createdAt
        DATETIME updatedAt
    }

    budget_goals {
        TEXT id PK
        TEXT budgetMonthId FK
        TEXT groupName
        TEXT description
        REAL targetAmount
        REAL achievedAmount
        INTEGER priorityWeek
        DATETIME createdAt
        DATETIME updatedAt
    }

    vehicle_maintenances {
        TEXT id PK
        TEXT vehicleId FK
        TEXT description
        REAL cost
        REAL kmAtService
        DATETIME serviceDate
        DATETIME createdAt
    }
```
