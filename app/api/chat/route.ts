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
    let { message, jsonData } = JSON.parse(decodedBody);
    const sendingData = { message, jsonData };
    console.log(sendingData);

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
          "You are a driving support chatbot. Based on provided json data about driving incidents provided by police.  Use your knowledge base to best respond to user queries.",
        model: "gpt-4-turbo-preview",
        tools: [{ type: "retrieval" }],
      });
      assistantId = assistant.id;
      process.env.ASSISTANT_ID = assistantId; // Store the assistant ID for future use
    }

    // Retrieve the list of files currently attached to the assistant
    const assistantFiles = await openai.beta.assistants.files.list(assistantId);

    console.log("assistantFiles", assistantFiles);

    // Delete the old files
    for (const file of assistantFiles.data) {
      console.log("delete", file);
      await openai.beta.assistants.files.del(assistantId, file.id);
    }

    // Check if jsonData is a file path or actual data
    // if (typeof jsonData === "string") {
    //   console.log("jsonData" ,jsonData);
    //   // Assuming jsonData is a JSON string, write it to a file
    //   const filePath = "./tempJsonData.json"; // Temporary file path
    //   fs.writeFileSync(filePath, jsonData);
    //   jsonData = filePath; // Update jsonData to be the file path
    //   console.log("jsonData" ,jsonData);
    // }


    try {
      // Check if jsonData is a file path or actual data
      let filePath = jsonData;
      if (typeof jsonData === "object") { // If jsonData is an object, convert to string
          console.log("jsonData is an object, converting to string and writing to file");
          filePath = "/tmp/tempJsonData.json"; // Temporary file path in a writable directory
          fs.writeFileSync(filePath, JSON.stringify(jsonData));
          console.log("File written to", filePath);
      } else if (typeof jsonData === "string" && !jsonData.startsWith("/tmp/")) {
          // This condition assumes jsonData is a string that needs to be written to a file
          console.log("jsonData is a string, writing to file");
          filePath = "/tmp/tempJsonData.json"; // Use a fixed or dynamically generated path as needed
          fs.writeFileSync(filePath, jsonData);
          console.log("File written to", filePath);
      } // If jsonData is a string that already points to a file path (especially under /tmp), no action needed.

      // Use the filePath with fs.createReadStream for the OpenAI API
      const newFile = await openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants",
      });

      console.log("New file created with ID:", newFile.id);

      const assistantFile = await openai.beta.assistants.files.create(assistantId, {
          file_id: newFile.id,
      });

      console.log("Assistant file created:", assistantFile);

      // Continue with your logic...
  } catch (error) {
      console.error("File operation or OpenAI API error:", error);
      // Handle the error appropriately
  }


    // Upload a new file
    // const newFile = await openai.files.create({
    //   file: fs.createReadStream(jsonData),
    //   purpose: "assistants",
    // });

    // Attach the new file to the assistant
    // await openai.beta.assistants.files.create(assistantId, {
    //   file_id: newFile.id,
    // });

    const thread = await openai.beta.threads.create();

    console.log("thred", thread);

    const threadMessage = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    console.log("threadMessage", threadMessage);

    // Create the run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    console.log("run", run);

    // Increase timeout to 60 seconds for more leeway
    const timeout = 60000; // 60 seconds timeout
    const startTime = Date.now();

    let runResult;
    while (Date.now() - startTime < timeout) {
      const currentRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (currentRun.status === "completed") {
        runResult = currentRun;
        break; // Exit the loop if the run is completed
      } else if (currentRun.status === "failed") {
        console.error("Run failed with error:", currentRun.last_error);
        throw new Error("Run failed");
      }
      // Poll less frequently to reduce load and wait patiently for completion
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for 3 seconds before polling again
    }

    if (!runResult) {
      console.error("Run did not complete in time. Current run status:", run.status);
      throw new Error("Run did not complete in time");
    }

    // Retrieve the messages from the thread
    const threadMessages = await openai.beta.threads.messages.list(thread.id);

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

    const apiResponse = { response: assistantResponseText };

    console.log(apiResponse);

    return new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
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
