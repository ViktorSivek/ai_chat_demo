import OpenAI from "openai";
import * as dotenv from "dotenv";
import type { NextRequest } from "next/server";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
        // Handle the case where there is no body
        // You might want to return an error or a specific response
        return new Response("No request body", { status: 400 });
    }
  
    const body = await request.body.getReader().read();
    const decodedBody = new TextDecoder().decode(body.value);
    let { threadId, runId } = JSON.parse(decodedBody);
    const sendingData = { threadId, runId };
    console.log("sendingData", sendingData);

    let runResult;
    const timeout = 60000; // 60 seconds for example
    const startTime = Date.now();

    // Wait for the run to complete or fail
    while (Date.now() - startTime < timeout) {
        const currentRun = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log("Polling for run status", currentRun);
  
        if (currentRun.status === "completed") {
          runResult = currentRun;
          break; // Exit the loop if the run is completed
        } else if (currentRun.status === "failed") {
          console.error("Run failed with error:", currentRun.last_error);
          return new Response(JSON.stringify({ error: "Run failed", details: currentRun.last_error }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
  
        // Poll less frequently to reduce load and wait patiently for completion
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (!runResult) {
        console.error("Run did not complete in time.");
        return new Response(JSON.stringify({ error: "Run did not complete in time" }), {
          status: 408, // Request Timeout
          headers: { "Content-Type": "application/json" },
        });
    }

    // Retrieve the messages from the thread
    const threadMessages = await openai.beta.threads.messages.list(threadId);

    // Find the assistant's response among the messages
    const assistantResponse = threadMessages.data.find(
        (msg) => msg.role === "assistant",
    );
    
    let assistantResponseText = "No response from assistant."; // Default response

    if (assistantResponse && assistantResponse.content) {
    // Extract text from each content element
    assistantResponseText = assistantResponse.content
        .map((contentItem) => {
        if (
            contentItem.type === "text" &&
            contentItem.text &&
            contentItem.text.value
        ) {
            return contentItem.text.value; // Safely access the 'value' property
        }
        return "";
        })
        .join(" "); // Join multiple text elements with space
    }



    return new Response(JSON.stringify({ response: assistantResponseText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
