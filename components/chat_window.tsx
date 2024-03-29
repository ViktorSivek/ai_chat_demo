"use client";

import { useState } from "react";
import { setupAssistant, processMessage, checkStatusAndRetrieve } from '@/utils/apiHelper';

type ChatMessage = {
  type: "question" | "response";
  text: string;
};

interface ChatWindowProps {
  jsonData: string;
}

const Chat_window: React.FC<ChatWindowProps> = ({ jsonData }) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageChange = (event: any) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (message.trim()) {
      setIsLoading(true);
      setChatHistory((chatHistory) => [
        ...chatHistory,
        { type: "question", text: message },
      ]);

      console.log("co submituju pred api fetch", message);

      try {

        // Step 1: Setup
        const { assistantId, fileId } = await setupAssistant(jsonData);

        // Step 2: Process Message
        const { threadId, runId } = await processMessage({ message, assistantId, fileId });

        // Step 3: Check Status and Retrieve Response
        const responseData = await checkStatusAndRetrieve({ threadId, runId });

        console.log("Response data received:", responseData);

        setChatHistory((chatHistory) => [
          ...chatHistory,
          { type: "response", text: responseData.response },
        ]);

        // Clear the input after sending
        setMessage("");


        // const response = await fetch("/api/chat", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({ message, jsonData }),
        // });

        // if (!response.ok) {
        //   throw new Error(`Error: ${response.status}`);
        // }

        // const responseData = await response.json();
        // console.log("Response data received:", responseData);

        // setChatHistory((chatHistory) => [
        //   ...chatHistory,
        //   { type: "response", text: responseData.response },
        // ]);

        // // Clear the input after sending
        // setMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsLoading(false); // End loading
      }
    }
  };

  return (
    <div className="mx-auto p-4 pb-16 pt-16 sm:max-w-xl lg:max-w-4xl">
      <div className="rounded-lg bg-white p-4 shadow-md">
        <div className="mb-4 flex items-center">
          <div className="ml-3">
            <p className="text-xl font-medium">Your AI Assistant</p>
          </div>
        </div>

        <div className="space-y-4">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`flex ${chat.type === "response" ? "items-start" : "items-end justify-end"}`}
            >
              <div
                className={`${chat.type === "response" ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white"} rounded-lg p-3`}
              >
                <p className="text-sm">{chat.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 rounded-full bg-gray-100 px-3 py-2 focus:outline-none"
            value={message}
            onChange={handleMessageChange}
          />
          <button className="ml-3 rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat_window;
