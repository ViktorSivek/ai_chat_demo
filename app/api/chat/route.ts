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
    console.log("sendingData", sendingData);

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
        model: "gpt-4-turbo",
        tools: [{ type: "file_search" }],
      });
      assistantId = assistant.id;
      process.env.ASSISTANT_ID = assistantId; // Store the assistant ID for future use
    }

    // File handling will now be done via tool_resources in the run
    // So, we remove the direct assistant file management here.

    let newFile: OpenAI.Files.FileObject | undefined = undefined;
    try {
      const fs = require("fs");

      const filename = "tempJsonData.json";
      const tempFilePath = `/tmp/${filename}`;

      // Ensure jsonData is stringified if it's an object
      const jsonDataString =
        typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);
      fs.writeFileSync(tempFilePath, jsonDataString);

      newFile = await openai.files.create({
        // Assign to the outer scope newFile
        file: fs.createReadStream(tempFilePath),
        purpose: "assistants",
      });

      fs.unlinkSync(tempFilePath);

      console.log("newFile", newFile);

      // We no longer attach the file directly to the assistant here.
      // It will be passed in tool_resources during run creation.
    } catch (error) {
      console.error("File operation or OpenAI API error:", error);
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

    console.log("thred", thread);

    const threadMessage = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
      attachments: newFile
        ? [{ file_id: newFile.id, tools: [{ type: "file_search" }] }]
        : [],
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
      const currentRun = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id,
      );
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
      console.error(
        "Run did not complete in time. Current run status:",
        run.status,
      );
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
