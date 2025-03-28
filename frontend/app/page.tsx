import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // Get user session in a server component
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to the login page if there's no session
    redirect("/login");
  } else {
    // Redirect to the dashboard if a session exists
    redirect("/dashboard");
  }
}
