# 🏛️ Documentação de Arquitetura — Girô v1.0

## 1. Visão Geral do Sistema
O **Girô** é uma solução fullstack de alta performance desenvolvida sob os preceitos de arquitetura modular, desacoplamento de persistência e Clean Code, projetada especificamente para atender a rotina financeira e operacional de motoristas de aplicativo.

## 2. Topologia de Pastas Aplicada

```
📁 giro/
  📁 .antigravity/          # Memória de contexto do agente
  📁 docs/                  # Arquitetura, diagramas e contratos
  📁 prisma/                # Schema ORM e migrações versionadas
  📁 src/
    📁 core/                # Camada Global e Infraestrutura
      📁 config/            # Variáveis de ambiente e constantes
      📁 database/          # Prisma client e scripts de seed
      📁 errors/            # Handlers de erro
      📁 theme/             # Design System e estilos globais
      📁 utils/             # Funções utilitárias puras
    📁 modules/             # Domínios de Negócio Isolados
      📁 dashboard/         # Visão geral, gráficos anuais e consolidação temporal
      📁 fuel-log/          # Registro diário de trabalho, KM e múltiplos combustíveis
      📁 expenses/          # Contas a pagar, despesas fixas e parcelamentos editáveis
      📁 earnings/          # Fechamento e consolidação de semanas
      📁 vehicle/           # IPVA, licenciamento e manutenções
    📁 shared/              # Componentes de UI reutilizáveis
    📁 server/              # Entry point da API Fastify
    📄 main.tsx             # Entry point do Frontend React
```

## 3. Principais Funcionalidades Implementadas

1. **Navegação Temporal Completa:**
   - Seletor de Ano (`2025`, `2026`, `2027`...) permitindo visualizar históricos passados e planejar anos futuros.
   - Alternância entre **Visão Anual Consolidada** (12 meses) e **Visão Detalhada por Mês** (`Jan` a `Dez`).

2. **Gráfico Anual Reativo em Tempo Real:**
   - Gráfico de barras e linhas (Recharts) exibindo Receitas Brutas, Custos de Combustível, Contas Operacionais e a Curva de Saldo Líquido Real.
   - Atualização automática sem necessidade de recarregar a página (reatividade via TanStack Query).

3. **Módulo Diário de KM e Combustível (`fuel-log`):**
   - Lançamento de KM Inicial, KM Final e KM Total calculado instantaneamente.
   - Seleção do tipo de abastecimento: **Gasolina**, **Etanol** ou **Ambos**.
   - Cálculo automático de litros consumidos, preço por litro e custo total.

4. **Módulo de Autenticação & Segurança (`auth`):**
   - Hashing seguro de senhas com `bcryptjs`.
   - Geração e verificação de tokens JWT via `@fastify/jwt`.
   - Padrão Repository (`UserRepository`) desacoplado da regra de negócio (`AuthService`).
   - Sessão no frontend gerenciada por `useAuth()` e persistida via localStorage.

5. **Layout Base & Navegação Modular:**
   - **Sidebar Lateral** com alternância entre `Dashboard`, `Lançamentos Diários`, `Contas & Despesas` e `Veículo & IPVA`.
   - **Header Superior** com identificação do usuário logado, botão mobile e status ativo.
   - **Proteção de Rotas:** Bloqueio automático de telas para usuários não autenticados com redirecionamento para `AuthPage`.

---

## 4. Status de Entrega: Fase 1 (Fundação) — 100% CONCLUÍDA ✅
- [x] Monorepo e Topologia Modular
- [x] Backend Fastify + TypeScript + Prisma ORM
- [x] Frontend React 19 + Vite + Tailwind + Lucide Icons + Recharts
- [x] Modelagem de Banco de Dados e Migrations
- [x] Seeds com dados reais da planilha (Janeiro a Julho/2026)
- [x] Módulo `auth` (Registro, Login, JWT, Bcrypt e Hook useAuth)
- [x] Layout Base (Sidebar, Header e Rotas Protegidas)

