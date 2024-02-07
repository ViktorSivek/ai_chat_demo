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
    let { message, assistantId, fileId } = JSON.parse(decodedBody);
    const sendingData = { message, assistantId, fileId };
    console.log("sendingData", sendingData);

    const thread = await openai.beta.threads.create();

    console.log("thred", thread);

    const threadId = thread.id

    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    console.log("threadMessage", threadMessage);

    // Create the run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    const runId = run.id;

    console.log("run", run);


    return new Response(JSON.stringify({ threadId, runId }), {
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
