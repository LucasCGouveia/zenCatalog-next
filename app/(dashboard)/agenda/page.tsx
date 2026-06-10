import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAgendaData } from "@/src/agenda/actions/agendaActions";
import { AgendaBoard } from "@/src/agenda/components/AgendaBoard";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const data = await getAgendaData();

  return (
    <AgendaBoard
      initialData={JSON.parse(JSON.stringify(data))}
    />
  );
}
