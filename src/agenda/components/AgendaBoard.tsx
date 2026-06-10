"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowLeftRight,
  CalendarDays,
  FileText,
  GripVertical,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createAgendaCard,
  deleteAgendaCard,
  moveAgendaCard,
  updateAgendaAxes,
  updateAgendaCard,
  updateAgendaOrientation,
} from "@/src/agenda/actions/agendaActions";

type Status = {
  id: string;
  name: string;
  color: string;
  position: number;
};

type Lane = {
  id: string;
  name: string;
  position: number;
};

type LinkedNote = {
  id: string;
  title: string;
  folderId: string;
};

type Card = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  dueDate: string | null;
  statusId: string;
  laneId: string;
  noteId: string | null;
  note: LinkedNote | null;
  position: number;
};

type Folder = {
  id: string;
  name: string;
  notes: LinkedNote[];
};

type BoardData = {
  board: {
    id: string;
    name: string;
    orientation: string;
    statuses: Status[];
    lanes: Lane[];
    cards: Card[];
  };
  folders: Folder[];
};

type CardDraft = {
  id?: string;
  title: string;
  description: string;
  color: string;
  dueDate: string;
  statusId: string;
  laneId: string;
  noteId: string;
};

const noteColors = [
  "#FDE68A",
  "#FCA5A5",
  "#FDBA74",
  "#86EFAC",
  "#93C5FD",
  "#C4B5FD",
  "#F9A8D4",
];

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function AgendaPostIt({
  card,
  onEdit,
  overlay = false,
}: {
  card: Card;
  onEdit?: (card: Card) => void;
  overlay?: boolean;
}) {
  const draggable = useDraggable({
    id: card.id,
    disabled: overlay,
  });

  const style = overlay
    ? undefined
    : {
        transform: draggable.transform
          ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`
          : undefined,
      };

  return (
    <article
      ref={overlay ? undefined : draggable.setNodeRef}
      style={{ ...style, backgroundColor: card.color }}
      className={`group relative min-h-28 rounded-sm p-3 text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition ${
        overlay ? "w-64 rotate-2 shadow-2xl" : "hover:-translate-y-0.5 hover:shadow-xl"
      } ${draggable.isDragging ? "opacity-30" : ""}`}
    >
      <div className="absolute inset-x-0 bottom-0 h-3 bg-black/5 [clip-path:polygon(0_0,100%_35%,94%_100%,4%_80%)]" />
      <div className="relative flex items-start gap-2">
        <button
          {...(overlay ? {} : draggable.listeners)}
          {...(overlay ? {} : draggable.attributes)}
          className="mt-0.5 cursor-grab rounded p-0.5 text-slate-500/60 hover:bg-black/5 hover:text-slate-700 active:cursor-grabbing"
          aria-label="Arrastar post-it"
        >
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(card)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="line-clamp-3 text-sm font-black leading-snug">
            {card.title}
          </h3>
          {card.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-700">
              {card.description}
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(card)}
          className="rounded p-1 text-slate-600 opacity-0 transition hover:bg-black/5 group-hover:opacity-100"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        {card.dueDate && (
          <span className="flex items-center gap-1 rounded-full bg-white/55 px-2 py-1 text-[10px] font-bold">
            <CalendarDays size={11} />
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            }).format(new Date(card.dueDate))}
          </span>
        )}
        {card.note && (
          <Link
            href={`/anotacoes?note=${card.note.id}`}
            onClick={(event) => event.stopPropagation()}
            className="flex max-w-full items-center gap-1 rounded-full bg-white/55 px-2 py-1 text-[10px] font-bold hover:bg-white/80"
            title={`Abrir anotação: ${card.note.title}`}
          >
            <FileText size={11} />
            <span className="max-w-28 truncate">{card.note.title}</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function BoardCell({
  statusId,
  laneId,
  cards,
  onAdd,
  onEdit,
}: {
  statusId: string;
  laneId: string;
  cards: Card[];
  onAdd: () => void;
  onEdit: (card: Card) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell:${statusId}:${laneId}`,
  });

  return (
    <section
      ref={setNodeRef}
      className={`group/cell min-h-44 border-b border-r border-slate-200/80 p-3 transition ${
        isOver ? "bg-blue-100/80 ring-2 ring-inset ring-blue-400" : "bg-white/75"
      }`}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {cards.map((card) => (
          <AgendaPostIt key={card.id} card={card} onEdit={onEdit} />
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className={`mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-400 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 ${
          cards.length ? "opacity-0 group-hover/cell:opacity-100" : "opacity-100"
        }`}
      >
        <Plus size={14} /> Novo post-it
      </button>
    </section>
  );
}

function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white text-slate-900 shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <h2 className="text-xl font-black">{title}</h2>
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

export function AgendaBoard({ initialData }: { initialData: BoardData }) {
  const [data, setData] = useState(initialData);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [cardDraft, setCardDraft] = useState<CardDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const { board } = data;
  const statusColumns = board.orientation === "STATUS_COLUMNS";
  const columns = statusColumns ? board.statuses : board.lanes;
  const rows = statusColumns ? board.lanes : board.statuses;

  const cardsByCell = useMemo(() => {
    const result = new Map<string, Card[]>();
    for (const card of board.cards) {
      const key = `${card.statusId}:${card.laneId}`;
      result.set(key, [...(result.get(key) ?? []), card]);
    }
    return result;
  }, [board.cards]);

  function openNewCard(statusId: string, laneId: string) {
    setCardDraft({
      title: "",
      description: "",
      color: noteColors[0],
      dueDate: "",
      statusId,
      laneId,
      noteId: "",
    });
  }

  function openEditCard(card: Card) {
    setCardDraft({
      id: card.id,
      title: card.title,
      description: card.description ?? "",
      color: card.color,
      dueDate: dateInputValue(card.dueDate),
      statusId: card.statusId,
      laneId: card.laneId,
      noteId: card.noteId ?? "",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    if (!event.over) return;

    const [, statusId, laneId] = String(event.over.id).split(":");
    const card = board.cards.find((item) => item.id === event.active.id);
    if (!card || !statusId || !laneId) return;
    if (card.statusId === statusId && card.laneId === laneId) return;

    const previousCards = board.cards;
    setData((current) => ({
      ...current,
      board: {
        ...current.board,
        cards: current.board.cards.map((item) =>
          item.id === card.id ? { ...item, statusId, laneId } : item,
        ),
      },
    }));

    startTransition(async () => {
      try {
        await moveAgendaCard(card.id, statusId, laneId);
        toast.success("Post-it movido");
      } catch (error) {
        setData((current) => ({
          ...current,
          board: { ...current.board, cards: previousCards },
        }));
        toast.error(error instanceof Error ? error.message : "Não foi possível mover");
      }
    });
  }

  function saveCard() {
    if (!cardDraft?.title.trim()) {
      toast.error("Escreva um título para o post-it");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...cardDraft,
          noteId: cardDraft.noteId || null,
        };
        const saved = cardDraft.id
          ? await updateAgendaCard(cardDraft.id, payload)
          : await createAgendaCard(payload);
        const normalized = JSON.parse(JSON.stringify(saved)) as Card;

        setData((current) => ({
          ...current,
          board: {
            ...current.board,
            cards: cardDraft.id
              ? current.board.cards.map((card) =>
                  card.id === normalized.id ? normalized : card,
                )
              : [...current.board.cards, normalized],
          },
        }));
        setCardDraft(null);
        toast.success(cardDraft.id ? "Post-it atualizado" : "Post-it criado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar");
      }
    });
  }

  function removeCard() {
    if (!cardDraft?.id || !confirm("Excluir este post-it?")) return;

    startTransition(async () => {
      try {
        await deleteAgendaCard(cardDraft.id!);
        setData((current) => ({
          ...current,
          board: {
            ...current.board,
            cards: current.board.cards.filter((card) => card.id !== cardDraft.id),
          },
        }));
        setCardDraft(null);
        toast.success("Post-it excluído");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir");
      }
    });
  }

  function toggleOrientation() {
    const orientation = statusColumns ? "LANE_COLUMNS" : "STATUS_COLUMNS";
    setData((current) => ({
      ...current,
      board: { ...current.board, orientation },
    }));

    startTransition(async () => {
      try {
        await updateAgendaOrientation(orientation);
      } catch {
        setData((current) => ({
          ...current,
          board: {
            ...current.board,
            orientation: statusColumns ? "STATUS_COLUMNS" : "LANE_COLUMNS",
          },
        }));
        toast.error("Não foi possível inverter o quadro");
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-400">
            <LayoutGrid size={15} /> Organização visual
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            {board.name}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Mova os post-its entre áreas e etapas. Cada cartão pode apontar para
            uma anotação completa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleOrientation}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeftRight size={17} />
            {statusColumns ? "Áreas nas colunas" : "Status nas colunas"}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            <Settings2 size={17} /> Configurar quadro
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={(event) =>
          setActiveCard(board.cards.find((card) => card.id === event.active.id) ?? null)
        }
        onDragCancel={() => setActiveCard(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-100 shadow-2xl">
          <div
            className="grid min-w-[980px]"
            style={{
              gridTemplateColumns: `180px repeat(${columns.length}, minmax(260px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 flex items-center border-b border-r border-slate-200 bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
              {statusColumns ? "Áreas" : "Etapas"}
            </div>
            {columns.map((column) => (
              <div
                key={column.id}
                className="border-b border-r border-slate-200 bg-slate-900 px-5 py-4 text-center text-sm font-black uppercase tracking-wider text-white"
                style={
                  statusColumns && "color" in column
                    ? { boxShadow: `inset 0 -4px ${column.color}` }
                    : undefined
                }
              >
                {column.name}
              </div>
            ))}

            {rows.map((row) => (
              <div className="contents" key={row.id}>
                <div
                  className="sticky left-0 z-10 flex min-h-44 items-center border-b border-r border-slate-200 bg-slate-50 px-5 py-4"
                  style={
                    !statusColumns && "color" in row
                      ? { borderLeft: `5px solid ${row.color}` }
                      : undefined
                  }
                >
                  <span className="font-black text-slate-700">{row.name}</span>
                </div>
                {columns.map((column) => {
                  const statusId = statusColumns ? column.id : row.id;
                  const laneId = statusColumns ? row.id : column.id;
                  const cards = cardsByCell.get(`${statusId}:${laneId}`) ?? [];
                  return (
                    <BoardCell
                      key={`${statusId}:${laneId}`}
                      statusId={statusId}
                      laneId={laneId}
                      cards={cards}
                      onAdd={() => openNewCard(statusId, laneId)}
                      onEdit={openEditCard}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeCard ? <AgendaPostIt card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {cardDraft && (
        <Modal
          title={cardDraft.id ? "Editar post-it" : "Novo post-it"}
          onClose={() => setCardDraft(null)}
        >
          <div className="space-y-5 p-6">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Título
              </span>
              <input
                autoFocus
                value={cardDraft.title}
                onChange={(event) =>
                  setCardDraft({ ...cardDraft, title: event.target.value })
                }
                placeholder="Ex: Aula 13/06 - Vida após a morte"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Detalhes
              </span>
              <textarea
                value={cardDraft.description}
                onChange={(event) =>
                  setCardDraft({ ...cardDraft, description: event.target.value })
                }
                rows={3}
                placeholder="Uma lembrança curta sobre a tarefa..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={cardDraft.statusId}
                  onChange={(event) =>
                    setCardDraft({ ...cardDraft, statusId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {board.statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Área
                </span>
                <select
                  value={cardDraft.laneId}
                  onChange={(event) =>
                    setCardDraft({ ...cardDraft, laneId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {board.lanes.map((lane) => (
                    <option key={lane.id} value={lane.id}>
                      {lane.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Data
                </span>
                <input
                  type="date"
                  value={cardDraft.dueDate}
                  onChange={(event) =>
                    setCardDraft({ ...cardDraft, dueDate: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
              <label>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Link2 size={13} /> Anotação vinculada
                </span>
                <select
                  value={cardDraft.noteId}
                  onChange={(event) =>
                    setCardDraft({ ...cardDraft, noteId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Nenhuma anotação</option>
                  {data.folders.map((folder) => (
                    <optgroup key={folder.id} label={folder.name}>
                      {folder.notes.map((note) => (
                        <option key={note.id} value={note.id}>
                          {note.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Cor do post-it
              </span>
              <div className="flex flex-wrap gap-2">
                {noteColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setCardDraft({ ...cardDraft, color })}
                    className={`h-9 w-9 rounded-xl border-2 transition ${
                      cardDraft.color === color
                        ? "scale-110 border-slate-700 shadow-md"
                        : "border-white ring-1 ring-slate-200"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Usar cor ${color}`}
                  />
                ))}
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-slate-100 pt-5">
              {cardDraft.id ? (
                <button
                  onClick={removeCard}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} /> Excluir
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setCardDraft(null)}
                  className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCard}
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isPending ? "Salvando..." : "Salvar post-it"}
                </button>
              </div>
            </footer>
          </div>
        </Modal>
      )}

      {settingsOpen && (
        <BoardSettings
          board={board}
          pending={isPending}
          onClose={() => setSettingsOpen(false)}
          onSave={(next) => {
            startTransition(async () => {
              try {
                await updateAgendaAxes(next);
                window.location.reload();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Erro ao configurar",
                );
              }
            });
          }}
        />
      )}
    </div>
  );
}

function BoardSettings({
  board,
  pending,
  onClose,
  onSave,
}: {
  board: BoardData["board"];
  pending: boolean;
  onClose: () => void;
  onSave: (input: {
    boardName: string;
    statuses: Array<{ id?: string; name: string; color: string }>;
    lanes: Array<{ id?: string; name: string }>;
  }) => void;
}) {
  const [boardName, setBoardName] = useState(board.name);
  const [statuses, setStatuses] = useState<
    Array<{ id?: string; name: string; color: string }>
  >(
    board.statuses.map(({ id, name, color }) => ({ id, name, color })),
  );
  const [lanes, setLanes] = useState<Array<{ id?: string; name: string }>>(
    board.lanes.map(({ id, name }) => ({ id, name })),
  );

  return (
    <Modal title="Configurar quadro" onClose={onClose} wide>
      <div className="space-y-6 p-6">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
            Nome do quadro
          </span>
          <input
            value={boardName}
            onChange={(event) => setBoardName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
          />
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black">Etapas</h3>
                <p className="text-xs text-slate-500">Status dos post-its</p>
              </div>
              <button
                onClick={() =>
                  setStatuses([
                    ...statuses,
                    { name: "Nova etapa", color: "#64748B" },
                  ])
                }
                className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div key={status.id ?? index} className="flex gap-2">
                  <input
                    type="color"
                    value={status.color}
                    onChange={(event) => {
                      const next = [...statuses];
                      next[index] = { ...status, color: event.target.value };
                      setStatuses(next);
                    }}
                    className="h-11 w-12 rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    value={status.name}
                    onChange={(event) => {
                      const next = [...statuses];
                      next[index] = { ...status, name: event.target.value };
                      setStatuses(next);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      setStatuses(statuses.filter((_, item) => item !== index))
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black">Áreas</h3>
                <p className="text-xs text-slate-500">Linhas da sua agenda</p>
              </div>
              <button
                onClick={() => setLanes([...lanes, { name: "Nova área" }])}
                className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {lanes.map((lane, index) => (
                <div key={lane.id ?? index} className="flex gap-2">
                  <input
                    value={lane.name}
                    onChange={(event) => {
                      const next = [...lanes];
                      next[index] = { ...lane, name: event.target.value };
                      setLanes(next);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      setLanes(lanes.filter((_, item) => item !== index))
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Dica:</strong> uma etapa ou área que já tenha post-its não pode
          ser removida até os cartões serem movidos.
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            disabled={pending}
            onClick={() => onSave({ boardName, statuses, lanes })}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar configuração"}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
