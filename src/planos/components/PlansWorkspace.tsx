"use client";

import {
  ArrowLeft,
  Check,
  Download,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  Search,
  Settings2,
  Table2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPlan,
  createPlanColumn,
  createPlanRow,
  deletePlan,
  deletePlanColumn,
  deletePlanRow,
  updatePlanCell,
  updatePlanColumn,
  updatePlanMeta,
} from "@/src/planos/actions/planosActions";

type ColumnType = "TEXT" | "NUMBER" | "DATE" | "CHECK";

type PlanColumn = {
  id: string;
  name: string;
  type: ColumnType;
  position: number;
  width: number;
};

type PlanRow = {
  id: string;
  position: number;
  values: Record<string, string | number | boolean | null>;
};

type Plan = {
  id: string;
  title: string;
  description: string | null;
  columns: PlanColumn[];
  rows: PlanRow[];
};

type PlansData = {
  plans: Plan[];
};

const columnTypes: Array<{ value: ColumnType; label: string }> = [
  { value: "TEXT", label: "Texto" },
  { value: "NUMBER", label: "Número" },
  { value: "DATE", label: "Data" },
  { value: "CHECK", label: "Sim/Não" },
];

function cellToString(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fechar" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function PlansWorkspace({ initialData }: { initialData: PlansData }) {
  const [data, setData] = useState(initialData);
  const [activePlanId, setActivePlanId] = useState(initialData.plans[0]?.id ?? "");
  const [view, setView] = useState<"list" | "sheet">("list");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [planDraft, setPlanDraft] = useState<{ id?: string; title: string; description: string } | null>(null);
  const [columnDraft, setColumnDraft] = useState<{ id?: string; name: string; type: ColumnType } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const activePlan = data.plans.find((plan) => plan.id === activePlanId) ?? data.plans[0];

  const filteredRows = useMemo(() => {
    if (!activePlan) return [];
    const global = globalFilter.trim().toLowerCase();

    return activePlan.rows.filter((row) => {
      const matchesColumns = activePlan.columns.every((column) => {
        const filter = filters[column.id]?.trim().toLowerCase();
        if (!filter) return true;
        return cellToString(row.values[column.id]).toLowerCase().includes(filter);
      });

      if (!matchesColumns) return false;
      if (!global) return true;

      return activePlan.columns.some((column) =>
        cellToString(row.values[column.id]).toLowerCase().includes(global),
      );
    });
  }, [activePlan, filters, globalFilter]);

  function patchPlan(planId: string, updater: (plan: Plan) => Plan) {
    setData((current) => ({
      plans: current.plans.map((plan) => (plan.id === planId ? updater(plan) : plan)),
    }));
  }

  function openPlan(planId: string) {
    setActivePlanId(planId);
    setFilters({});
    setGlobalFilter("");
    setView("sheet");
  }

  function savePlanDraft() {
    if (!planDraft?.title.trim()) {
      toast.error("Dê um nome para o plano");
      return;
    }

    startTransition(async () => {
      try {
        if (planDraft.id) {
          const updated = await updatePlanMeta(planDraft.id, planDraft);
          patchPlan(planDraft.id, (plan) => ({
            ...plan,
            title: updated.title,
            description: updated.description,
          }));
          toast.success("Plano atualizado");
        } else {
          const created = JSON.parse(JSON.stringify(await createPlan(planDraft))) as Plan;
          setData((current) => ({ plans: [created, ...current.plans] }));
          setActivePlanId(created.id);
          setView("sheet");
          toast.success("Plano criado");
        }
        setPlanDraft(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar plano");
      }
    });
  }

  function removePlan(planId: string) {
    if (!confirm("Excluir este plano e todas as linhas dele?")) return;
    startTransition(async () => {
      try {
        await deletePlan(planId);
        setData((current) => {
          const plans = current.plans.filter((plan) => plan.id !== planId);
          setActivePlanId(plans[0]?.id ?? "");
          return { plans };
        });
        setView("list");
        toast.success("Plano excluído");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir plano");
      }
    });
  }

  function saveColumnDraft() {
    if (!activePlan || !columnDraft) return;
    startTransition(async () => {
      try {
        if (columnDraft.id) {
          const updated = await updatePlanColumn(columnDraft.id, columnDraft);
          patchPlan(activePlan.id, (plan) => ({
            ...plan,
            columns: plan.columns.map((column) =>
              column.id === updated.id
                ? { ...column, ...updated, type: updated.type as ColumnType }
                : column,
            ),
          }));
          toast.success("Coluna atualizada");
        } else {
          const created = await createPlanColumn(activePlan.id, columnDraft);
          patchPlan(activePlan.id, (plan) => ({
            ...plan,
            columns: [...plan.columns, { ...created, type: created.type as ColumnType }],
          }));
          toast.success("Coluna criada");
        }
        setColumnDraft(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar coluna");
      }
    });
  }

  function removeColumn(columnId: string) {
    if (!activePlan || !confirm("Excluir esta coluna?")) return;
    startTransition(async () => {
      try {
        await deletePlanColumn(columnId);
        patchPlan(activePlan.id, (plan) => ({
          ...plan,
          columns: plan.columns.filter((column) => column.id !== columnId),
          rows: plan.rows.map((row) => {
            const values = { ...row.values };
            delete values[columnId];
            return { ...row, values };
          }),
        }));
        setColumnDraft(null);
        toast.success("Coluna excluída");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir coluna");
      }
    });
  }

  function addRow() {
    if (!activePlan) return;
    startTransition(async () => {
      try {
        const row = await createPlanRow(activePlan.id);
        patchPlan(activePlan.id, (plan) => ({ ...plan, rows: [...plan.rows, row as PlanRow] }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao criar linha");
      }
    });
  }

  function removeRow(rowId: string) {
    if (!activePlan) return;
    startTransition(async () => {
      try {
        await deletePlanRow(rowId);
        patchPlan(activePlan.id, (plan) => ({
          ...plan,
          rows: plan.rows.filter((row) => row.id !== rowId),
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir linha");
      }
    });
  }

  function updateLocalCell(rowId: string, columnId: string, value: string | boolean) {
    if (!activePlan) return;
    patchPlan(activePlan.id, (plan) => ({
      ...plan,
      rows: plan.rows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [columnId]: value } }
          : row,
      ),
    }));
  }

  function persistCell(rowId: string, columnId: string, value: string | boolean) {
    startTransition(async () => {
      try {
        await updatePlanCell(rowId, columnId, String(value));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar célula");
      }
    });
  }

  async function importExcel(file: File | undefined) {
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);
    setIsImporting(true);

    try {
      const response = await fetch("/api/planos/import", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao importar Excel");
      }

      const importedPlans = result.plans as Plan[];
      setData((current) => ({ plans: [...importedPlans, ...current.plans] }));
      setActivePlanId(importedPlans[0]?.id ?? activePlanId);
      setView("sheet");
      setFilters({});
      setGlobalFilter("");
      toast.success(
        importedPlans.length === 1
          ? "Excel importado como novo plano"
          : `${importedPlans.length} abas importadas como planos`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar Excel");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (view === "list" || !activePlan) {
    const plans = data.plans.filter((plan) => {
      const search = globalFilter.trim().toLowerCase();
      if (!search) return true;
      return [plan.title, plan.description ?? ""].some((value) =>
        value.toLowerCase().includes(search),
      );
    });

    return (
      <>
        <div className="mx-auto max-w-[1500px] space-y-5 animate-in fade-in duration-500">
          <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-300">
                <FileSpreadsheet size={15} /> Planos
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Suas planilhas
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Abra um plano para editar em tela inteira, ou importe uma planilha do Excel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(event) => importExcel(event.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                <Upload size={17} /> {isImporting ? "Importando..." : "Importar Excel"}
              </button>
              <button
                onClick={() => setPlanDraft({ title: "Novo plano", description: "" })}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
              >
                <Plus size={17} /> Novo plano
              </button>
            </div>
          </header>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar plano pelo nome ou descrição"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          {plans.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-400/60 hover:bg-white/[0.07]"
                >
                  <button
                    type="button"
                    onClick={() => openPlan(plan.id)}
                    className="block w-full text-left"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h2 className="line-clamp-2 text-lg font-black text-white">
                      {plan.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-400">
                      {plan.description || "Sem descrição"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                      <span className="rounded-lg bg-slate-950/50 px-2 py-1">
                        {plan.rows.length} linhas
                      </span>
                      <span className="rounded-lg bg-slate-950/50 px-2 py-1">
                        {plan.columns.length} colunas
                      </span>
                    </div>
                  </button>
                  <footer className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <button
                      onClick={() =>
                        setPlanDraft({
                          id: plan.id,
                          title: plan.title,
                          description: plan.description ?? "",
                        })
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                      title="Editar plano"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openPlan(plan.id)}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950 hover:bg-slate-200"
                    >
                      Abrir
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
              <FileSpreadsheet size={34} className="mx-auto mb-3 text-slate-500" />
              <h2 className="text-lg font-black text-white">Nenhum plano apareceu</h2>
              <p className="mt-2 text-sm text-slate-400">
                Crie um plano novo ou importe um arquivo Excel.
              </p>
            </div>
          )}
        </div>

        {planDraft && (
          <Modal
            title={planDraft.id ? "Editar plano" : "Novo plano"}
            onClose={() => setPlanDraft(null)}
          >
            <div className="space-y-5 p-6">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Nome
                </span>
                <input
                  autoFocus
                  value={planDraft.title}
                  onChange={(event) => setPlanDraft({ ...planDraft, title: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Descrição
                </span>
                <textarea
                  value={planDraft.description}
                  onChange={(event) =>
                    setPlanDraft({ ...planDraft, description: event.target.value })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  onClick={() => setPlanDraft(null)}
                  className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePlanDraft}
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  Salvar
                </button>
              </footer>
            </div>
          </Modal>
        )}
      </>
    );
  }

  if (!activePlan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <button
          onClick={() => setPlanDraft({ title: "Novo plano", description: "" })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500"
        >
          <Plus size={18} /> Criar primeiro plano
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-5 animate-in fade-in duration-500 xl:flex-row">
      <aside className="hidden">
        <div className="mb-3 flex items-center justify-between px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
              Planos
            </p>
            <h2 className="text-lg font-black text-white">Suas planilhas</h2>
          </div>
          <button
            onClick={() => setPlanDraft({ title: "Novo plano", description: "" })}
            className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500"
            title="Novo plano"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {data.plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => openPlan(plan.id)}
              className={`rounded-xl border p-3 text-left transition ${
                plan.id === activePlan.id
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-white/10 bg-slate-950/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-blue-300" />
                <span className="min-w-0 flex-1 truncate text-sm font-black text-white">
                  {plan.title}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {plan.rows.length} linhas · {plan.columns.length} colunas
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <button
              onClick={() => setView("list")}
              className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} /> Voltar aos planos
            </button>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-300">
              <Table2 size={15} /> Planilha dinâmica
            </div>
            <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
              {activePlan.title}
            </h1>
            {activePlan.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                {activePlan.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => importExcel(event.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60"
            >
              <Upload size={17} /> {isImporting ? "Importando..." : "Importar"}
            </button>
            <button
              onClick={() =>
                setPlanDraft({
                  id: activePlan.id,
                  title: activePlan.title,
                  description: activePlan.description ?? "",
                })
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              <Pencil size={17} /> Editar
            </button>
            <a
              href={`/api/planos/${activePlan.id}/export`}
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-200 hover:bg-emerald-500/20"
            >
              <Download size={17} /> Exportar
            </a>
            <button
              onClick={() => setColumnDraft({ name: "Nova coluna", type: "TEXT" })}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus size={17} /> Coluna
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/55 p-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <Search size={17} className="text-slate-500" />
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar em todas as colunas"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Filter size={16} />
            {filteredRows.length} de {activePlan.rows.length} linhas
          </div>
          <button
            onClick={addRow}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-slate-200 disabled:opacity-60"
          >
            <Plus size={17} /> Linha
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white text-slate-900 shadow-2xl">
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="w-12 border-r border-white/10 px-2 py-3 text-center text-xs font-black">
                  #
                </th>
                {activePlan.columns.map((column) => (
                  <th
                    key={column.id}
                    style={{ width: column.width }}
                    className="border-r border-white/10 px-3 py-3 text-left align-top"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setColumnDraft(column)}
                        className="min-w-0 flex-1 truncate text-left text-xs font-black uppercase tracking-wide"
                        title="Editar coluna"
                      >
                        {column.name}
                      </button>
                      <button
                        onClick={() => setColumnDraft(column)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                        title="Configurar coluna"
                      >
                        <Settings2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-12 px-2 py-3" />
              </tr>
              <tr className="bg-slate-100">
                <th className="border-b border-r border-slate-200 px-2 py-2" />
                {activePlan.columns.map((column) => (
                  <th key={column.id} className="border-b border-r border-slate-200 px-2 py-2">
                    <input
                      value={filters[column.id] ?? ""}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          [column.id]: event.target.value,
                        }))
                      }
                      placeholder={`Filtrar ${column.name}`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                    />
                  </th>
                ))}
                <th className="border-b border-slate-200" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="group hover:bg-blue-50/70">
                  <td className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-bold text-slate-400">
                    {index + 1}
                  </td>
                  {activePlan.columns.map((column) => {
                    const value = row.values[column.id];
                    return (
                      <td key={column.id} className="border-b border-r border-slate-200 p-0">
                        {column.type === "CHECK" ? (
                          <button
                            onClick={() => {
                              const next = !Boolean(value);
                              updateLocalCell(row.id, column.id, next);
                              persistCell(row.id, column.id, next);
                            }}
                            className="flex h-11 w-full items-center justify-center hover:bg-blue-50"
                            title="Alternar"
                          >
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                                value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                              }`}
                            >
                              {value ? <Check size={15} /> : null}
                            </span>
                          </button>
                        ) : (
                          <input
                            type={
                              column.type === "DATE"
                                ? "date"
                                : column.type === "NUMBER"
                                  ? "number"
                                  : "text"
                            }
                            value={cellToString(value)}
                            onChange={(event) => updateLocalCell(row.id, column.id, event.target.value)}
                            onBlur={(event) => persistCell(row.id, column.id, event.target.value)}
                            className="h-11 w-full bg-transparent px-3 text-sm outline-none focus:bg-blue-50"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-slate-200 px-2 text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      title="Excluir linha"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td
                    colSpan={activePlan.columns.length + 2}
                    className="px-6 py-12 text-center text-sm font-bold text-slate-400"
                  >
                    Nenhuma linha apareceu com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => removePlan(activePlan.id)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <Trash2 size={16} /> Excluir plano
          </button>
        </div>
      </section>

      {planDraft && (
        <Modal
          title={planDraft.id ? "Editar plano" : "Novo plano"}
          onClose={() => setPlanDraft(null)}
        >
          <div className="space-y-5 p-6">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nome
              </span>
              <input
                autoFocus
                value={planDraft.title}
                onChange={(event) => setPlanDraft({ ...planDraft, title: event.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Descrição
              </span>
              <textarea
                value={planDraft.description}
                onChange={(event) =>
                  setPlanDraft({ ...planDraft, description: event.target.value })
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>
            <footer className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                onClick={() => setPlanDraft(null)}
                className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={savePlanDraft}
                disabled={isPending}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                Salvar
              </button>
            </footer>
          </div>
        </Modal>
      )}

      {columnDraft && (
        <Modal
          title={columnDraft.id ? "Editar coluna" : "Nova coluna"}
          onClose={() => setColumnDraft(null)}
        >
          <div className="space-y-5 p-6">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Cabeçalho
              </span>
              <input
                autoFocus
                value={columnDraft.name}
                onChange={(event) => setColumnDraft({ ...columnDraft, name: event.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Tipo
              </span>
              <select
                value={columnDraft.type}
                onChange={(event) =>
                  setColumnDraft({ ...columnDraft, type: event.target.value as ColumnType })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {columnTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <footer className="flex items-center justify-between border-t border-slate-100 pt-5">
              {columnDraft.id ? (
                <button
                  onClick={() => removeColumn(columnDraft.id!)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} /> Excluir
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setColumnDraft(null)}
                  className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveColumnDraft}
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </footer>
          </div>
        </Modal>
      )}
    </div>
  );
}
