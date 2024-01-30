"use client";

import Navbar from "@/components/navbar";
import Chat_window from "@/components/chat_window";
import Table from "@/components/table";
import Footer from "@/components/footer";
import React, { useState } from "react";

export default function DashboardPage() {
  const [chatData, setChatData] = useState<string>("");

  const handleDataFetch = (jsonString: string) => {
    setChatData(jsonString);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <Table onDataFetch={handleDataFetch} />
        <Chat_window jsonData={chatData} />
      </main>
      <Footer />
    </div>
  );
}
