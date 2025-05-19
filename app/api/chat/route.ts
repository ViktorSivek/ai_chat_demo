import OpenAI from "openai";
import * as dotenv from "dotenv";
import type { NextRequest } from "next/server";
import fs from "fs";
import { Stream } from "openai/streaming"; // Import Stream type

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to create a ReadableStream from the OpenAI stream
function OpenAIStream(
  openaiStream: AsyncIterable<OpenAI.Beta.AssistantStreamEvent>,
) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const event of openaiStream) {
        if (event.event === "thread.message.delta") {
          const chunk = event.data.delta.content?.[0];
          if (chunk && chunk.type === "text" && chunk.text?.value) {
            controller.enqueue(encoder.encode(chunk.text.value));
          }
        } else if (event.event === "thread.run.failed") {
          console.error("Run failed:", event.data);
          controller.error(new Error("Assistant run failed"));
          break;
        }
      }
      controller.close();
    },
    async cancel() {
      // await openaiStream.abort(); // Removed as 'abort' does not exist on type 'Stream<AssistantStreamEvent>'
      console.log("Stream cancelled by client.");
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      // Handle the case where there is no body
      // You might want to return an error or a specific response
      return new Response("No request body", { status: 400 });
    }

    const body = await request.body.getReader().read();
    const decodedBody = new TextDecoder().decode(body.value);
    let { message, jsonData } = JSON.parse(decodedBody);
    // const sendingData = { message, jsonData }; // This line seems unused, can be removed
    // console.log("sendingData", sendingData);

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is empty" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    let assistantId = process.env.ASSISTANT_ID; // Retrieve stored assistant ID

    if (!assistantId) {
      const assistant = await openai.beta.assistants.create({
        instructions:
          "You are a driving support chatbot. Based on provided json data about driving incidents provided by police, provide a concise and clear summary suitable for a radio broadcast. Do not include any file citations or source annotations (e.g., 【...†...】) in your response. Focus on delivering a clean, readable text.",
        model: "gpt-4o-mini",
        tools: [{ type: "file_search" }],
      });
      assistantId = assistant.id;
      process.env.ASSISTANT_ID = assistantId; // Store the assistant ID for future use
    }

    // File handling will now be done via tool_resources in the run
    // So, we remove the direct assistant file management here.

    let newFile: OpenAI.Files.FileObject | undefined = undefined;
    if (jsonData) {
      // Check if jsonData is provided
      try {
        // const fs = require("fs"); // fs is already imported at the top

        const filename = "tempJsonData.json";
        const tempFilePath = `/tmp/${filename}`; // Use /tmp for Vercel serverless functions

        const jsonDataString =
          typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);
        fs.writeFileSync(tempFilePath, jsonDataString);

        newFile = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: "assistants",
        });

        fs.unlinkSync(tempFilePath); // Clean up the temporary file
      } catch (error) {
        console.error("File operation or OpenAI API error:", error);
        // Potentially return an error response here if file handling is critical
      }
    }

    // try {

    //   if (typeof jsonData === "string") {
    //     // Assuming jsonData is a JSON string, write it to a file
    //     const filePath = "./tempJsonData.json"; // Temporary file path
    //     fs.writeFileSync(filePath, jsonData);
    //     jsonData = filePath; // Update jsonData to be the file path
    //     console.log("jsonData" ,jsonData);
    //   }

    //   const newFile = await openai.files.create({
    //     file: fs.createReadStream(jsonData),
    //     purpose: "assistants",
    //   });

    //   console.log("newFile" ,newFile);

    //   await openai.beta.assistants.files.create(assistantId, {
    //     file_id: newFile.id,
    //   });

    // } catch (error) {
    //     console.error("File operation or OpenAI API error:", error);
    // }

    const thread = await openai.beta.threads.create();

    // console.log("thred", thread);

    await openai.beta.threads.messages.create(thread.id, {
      // Removed threadMessage variable as it's not used later
      role: "user",
      content: message,
      attachments: newFile
        ? [{ file_id: newFile.id, tools: [{ type: "file_search" }] }]
        : [],
    });

    // console.log("threadMessage", threadMessage);

    // Create the run and get the stream
    // Note: The SDK might offer openai.beta.threads.runs.createAndStream for a more direct approach
    const runStream = openai.beta.threads.runs.stream(thread.id, {
      assistant_id: assistantId,
    });

    // The polling loop and subsequent message retrieval are no longer needed.
    // We will stream the response directly.

    // Return the stream
    return new Response(OpenAIStream(runStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8", // Or application/octet-stream if sending binary
        "X-Content-Type-Options": "nosniff", // Good practice for security
      },
    });
  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API Route Error:", error); // Log the full error on the server for debugging
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
