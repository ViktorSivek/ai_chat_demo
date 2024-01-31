import Image from "next/image";
import logo from "@/public/pcr.png";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  const { userId } = auth();

  if (userId) redirect("/dashboard");

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-5">
      <div className="flex items-center gap-4">
        <Image src={logo} alt="AIDoprava logo" width={100} height={100} />
        <span className="text-3xl font-extrabold tracking-tight lg:text-4xl">
          AI Dopravní informace
        </span>
      </div>
      <p className="max-w-prose text-center">
        Aktuální informace z českých silnic získané od policie české republiky
        integrované s chatbotem.
      </p>
      <Button size="lg" asChild>
        <Link href="/dashboard">Přihlásit se</Link>
      </Button>
    </main>
  );
}
