import Image from "next/image";
import Link from "next/link";
import logo from "@/public/pcr.png";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 w-full bg-white p-4 shadow">
      <div className="m-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-1">
          <Image src={logo} alt="AIDoprava logo" width={40} height={40} />
          <span className="font-bold">AI Doprava</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  width: "2.5rem",
                  height: "2.5rem",
                },
              },
            }}
          />
          {/* <Button>
            <RefreshCcw size={20} className="mr-2" />
            Refresh
          </Button> */}
        </div>
      </div>
    </div>
  );
}
