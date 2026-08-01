import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPlansData } from "@/src/planos/actions/planosActions";
import { PlansWorkspace } from "@/src/planos/components/PlansWorkspace";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const data = await getPlansData();

  return <PlansWorkspace initialData={JSON.parse(JSON.stringify(data))} />;
}
