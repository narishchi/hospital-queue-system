
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect("/dashboard");
}
