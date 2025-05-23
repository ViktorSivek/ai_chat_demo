"use client";

import { useState } from "react";
// import { setupAssistant, processMessage, checkStatusAndRetrieve } from '@/utils/apiHelper'; // No longer needed

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
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, jsonData }),
        });

        if (!response.ok) {
          // Try to parse error as JSON, as our server sends { error: "..." }
          let errorText = `Error: ${response.status} - ${response.statusText}`;
          try {
            const errorData = await response.json(); // Server sends JSON for errors
            if (errorData.error) {
              errorText = `Error: ${response.status} - ${errorData.error}`;
            }
          } catch (e) {
            // If response.json() fails (e.g. network error before server responds, or server sends non-JSON error)
            console.warn(
              "Could not parse error response as JSON, using status text.",
              e,
            );
          }
          throw new Error(errorText);
        }

        // Handle the streamed response
        if (!response.body) {
          throw new Error("Response body is null or undefined.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Add an empty response message to chatHistory that we will update
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { type: "response", text: "" },
        ]);

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });

          // Update the last message in chatHistory (which is the assistant's response)
          setChatHistory((prevHistory) => {
            const newHistory = [...prevHistory];
            // Ensure we are updating the correct (last) message and it's a response type
            if (
              newHistory.length > 0 &&
              newHistory[newHistory.length - 1].type === "response"
            ) {
              newHistory[newHistory.length - 1].text += chunk;
            }
            return newHistory;
          });
        }

        // Clear the input after sending
        setMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
        // Optionally, display error to user
        setChatHistory((prevHistory) => [
          ...prevHistory,
          {
            type: "response",
            text: `Error: ${error instanceof Error ? error.message : "Could not send message."}`,
          },
        ]);
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
          <button
            className="ml-3 rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat_window;
