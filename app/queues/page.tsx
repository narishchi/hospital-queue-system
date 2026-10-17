
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import QueuesClient from "./QueuesClient";

export const dynamic = "force-dynamic";

export default async function QueuesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <QueuesClient role="ADMIN" />;
}
