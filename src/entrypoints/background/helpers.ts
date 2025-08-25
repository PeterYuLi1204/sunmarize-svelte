import { ModelOption, MODEL_CONFIGS, PROMPT } from "@/utils/config";
import { ModelConfig } from "@/utils/interfaces";

export async function retrieveText() {
  // Find the active tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error("No active tab found");
  }

  // Call Chrome API to run content script
  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content-scripts/content.js"],
  });

  if (typeof results[0].result !== "string") {
    throw new Error("Failed to retrieve text");
  }

  const articleText = results[0].result;
  return articleText;
}

export async function getSelectedModel() {
  const model: ModelOption = (await browser.storage.local.get(["model"])).model;
  const modelConfig = MODEL_CONFIGS[model];
  if (!modelConfig) {
    throw new Error("Invalid model configuration");
  }

  return modelConfig;
}

export async function summarize(text: string, port: Browser.runtime.Port, { apiURL, model, apiKey }: ModelConfig) {
  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: text },
      ],
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to summarize text");
  }

  return response.body.getReader();
}

// Send summary to the popup as it's being decoded
export async function streamResults(reader: ReadableStreamDefaultReader<Uint8Array>, port: Browser.runtime.Port) {
  const decoder = new TextDecoder();

  try {
    // Read chunks until complete
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE format properly
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix

          // Skip empty lines and [DONE] marker
          if (data.trim() === "" || data.trim() === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              port.postMessage({ final: false, content });
            }
          } catch (parseError) {
            console.warn("Failed to parse SSE data:", parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Stream reading error:", error);
    port.postMessage({
      final: true,
      content: "Error reading stream: " + (error as Error).message,
    });
    return;
  }

  // Send a message to close the port
  port.postMessage({ final: true });
}
