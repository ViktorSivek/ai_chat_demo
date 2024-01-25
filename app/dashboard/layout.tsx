import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "./NavBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="p-4 max-w-7xl m-auto">{children}</main>
    </>
  );
}
