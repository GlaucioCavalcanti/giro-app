// Teste E2E de isolamento entre usuários (requer backend em http://localhost:3333)
const BASE = "http://localhost:3333";
let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  -> " + detail : ""}`);
  if (!ok) failures++;
}

async function call(path: string, token?: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  // 1. Sem token => bloqueado
  const anon = await call("/api/dashboard/annual-summary?year=2026");
  check("Sem token retorna 401", anon.status === 401, `status=${anon.status}`);

  // 2. Carlos vê os próprios dados
  const carlos = await call("/api/auth/login", undefined, {
    method: "POST",
    body: JSON.stringify({ email: "carlos@giro.app", password: "senha123456" }),
  });
  const tC = carlos.body.token as string;
  const cSum = await call("/api/dashboard/annual-summary?year=2026", tC);
  check("Carlos vê receita da planilha", cSum.body.totals?.revenue > 0, `receita=${cSum.body.totals?.revenue}`);

  // 3. Usuário novo => área zerada
  const email = `teste.isolamento.${Date.now()}@giro.app`;
  const novo = await call("/api/auth/register", undefined, {
    method: "POST",
    body: JSON.stringify({ name: "Teste Isolamento", email, password: "senha123456" }),
  });
  const tN = novo.body.token as string;
  check("Cadastro de usuário novo", novo.status === 201, `status=${novo.status}`);

  const nSum = await call("/api/dashboard/annual-summary?year=2026", tN);
  const t = nSum.body.totals ?? {};
  check("Novo usuário: totais anuais zerados", t.revenue === 0 && t.fuelCost === 0 && t.expenses === 0 && t.netBalance === 0, JSON.stringify(t));

  const nMonth = await call("/api/dashboard/monthly-detail?year=2026&month=7", tN);
  const b = nMonth.body.budget ?? {};
  check("Novo usuário: Julho/2026 sem despesas, semanas ou registros",
    b.expenses?.length === 0 && b.weeklyEarnings?.length === 0 && b.dailyWorkLogs?.length === 0);

  const nVeh = await call("/api/vehicle", tN);
  const v = nVeh.body.vehicle ?? {};
  check("Novo usuário: veículo zerado e sem débitos",
    v.taxes?.length === 0 && v.monthlyInstallment === 0 && v.insuranceValue === 0, `placa=${v.plate}`);

  // 4. Ataque cruzado: novo usuário tenta mexer em dados do Carlos
  const cJul = await call("/api/dashboard/monthly-detail?year=2026&month=7", tC);
  const carlosExpense = cJul.body.budget?.expenses?.[0];
  const cVeh = await call("/api/vehicle", tC);
  const carlosTax = cVeh.body.vehicle?.taxes?.[0];

  if (carlosExpense) {
    const p = await call(`/api/expenses/${carlosExpense.id}`, tN, { method: "PATCH", body: JSON.stringify({ isPaid: !carlosExpense.isPaid }) });
    check("Novo usuário NÃO edita despesa do Carlos", p.status === 404, `status=${p.status}`);
    const d = await call(`/api/expenses/${carlosExpense.id}`, tN, { method: "DELETE" });
    check("Novo usuário NÃO exclui despesa do Carlos", d.status === 404, `status=${d.status}`);
  }
  if (carlosTax) {
    const p = await call(`/api/vehicle/taxes/${carlosTax.id}`, tN, { method: "PATCH", body: JSON.stringify({ isPaid: !carlosTax.isPaid }) });
    check("Novo usuário NÃO edita débito do Carlos", p.status === 404, `status=${p.status}`);
    const d = await call(`/api/vehicle/taxes/${carlosTax.id}`, tN, { method: "DELETE" });
    check("Novo usuário NÃO exclui débito do Carlos", d.status === 404, `status=${d.status}`);
  }

  // 5. Dados do Carlos intactos após o ataque
  const cAfter = await call("/api/dashboard/annual-summary?year=2026", tC);
  check("Dados do Carlos intactos", cAfter.body.totals?.revenue === cSum.body.totals?.revenue);

  console.log(failures === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${failures} TESTE(S) FALHARAM`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
