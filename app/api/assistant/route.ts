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
        let { jsonData } = JSON.parse(decodedBody);
        const sendingData = { jsonData };
        console.log("jsonData", sendingData);

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

        const fs = require('fs');
    
        const filename = 'tempJsonData.json';
        const tempFilePath = `/tmp/${filename}`;
    
        fs.writeFileSync(tempFilePath, jsonData);
    
        const newFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: "assistants",
        });
    
        fs.unlinkSync(tempFilePath);

        const fileId = newFile.id;
    
        console.log("newFile" ,newFile);
    
        await openai.beta.assistants.files.create(assistantId, {
            file_id: fileId,
        });

        // if (typeof jsonData === "string") {
        //     // Assuming jsonData is a JSON string, write it to a file
        //     const filePath = "./tempJsonData.json"; // Temporary file path
        //     fs.writeFileSync(filePath, jsonData);
        //     jsonData = filePath; // Update jsonData to be the file path
        //     console.log("jsonData" ,jsonData);
        // }

        // const newFile = await openai.files.create({
        //     file: fs.createReadStream(jsonData),
        //     purpose: "assistants",
        // });

        // const fileId = newFile.id;

        // console.log("newFile" ,newFile);

        // await openai.beta.assistants.files.create(assistantId, {
        // file_id: newFile.id,
        // });

        console.log("assistantId" , assistantId);
        console.log("fileId" , fileId);

        return new Response(JSON.stringify({ assistantId, fileId }), {
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