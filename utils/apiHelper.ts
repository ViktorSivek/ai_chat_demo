interface JsonData {
    [key: string]: any;
  }
  
  interface ProcessMessageParams {
    message: string;
    assistantId: string;
    fileId: string;
  }
  
  interface CheckStatusParams {
    threadId: string;
    runId: string;
  }

export async function setupAssistant(jsonData: string) {
    const setupResponse = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jsonData }),
    });
  
    if (!setupResponse.ok) {
      throw new Error(`Setup failed: ${setupResponse.status}`);
    }
  
    return setupResponse.json(); // Returns { assistantId, fileId }
}
  
export async function processMessage({ message, assistantId, fileId }: ProcessMessageParams) {
    const processResponse = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, assistantId, fileId }),
    });
  
    if (!processResponse.ok) {
      throw new Error(`Processing failed: ${processResponse.status}`);
    }
  
    return processResponse.json(); // Returns { threadId, runId }
  }
  
export async function checkStatusAndRetrieve({ threadId, runId }: CheckStatusParams) {
    let statusResponse;
    const timeout = 60000; // 60 seconds for example
    const startTime = Date.now();
  
    while (Date.now() - startTime < timeout) {
      statusResponse = await fetch("/api/retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ threadId, runId }),
      });
  
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }
  
      const statusData = await statusResponse.json();
  
      if (statusData.response) {
        return statusData; // Returns { response: assistantResponseText }
      }
  
      // Wait for a bit before polling again
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  
    throw new Error("Run did not complete in time");
}