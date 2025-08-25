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

export async function summarize(text: string, { apiURL, model, apiKey }: ModelConfig, port: Browser.runtime.Port) {
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

  const decoderStream = new TextDecoderStream("utf-8");
  const writer = new WritableStream({
    write(chunk: string) {
      const messages = parseChunk(chunk);
      for (const message of messages) {
        port.postMessage({ final: false, content: message });
      }
    },
  });

  await response.body.pipeThrough(decoderStream).pipeTo(writer);
}

function parseChunk(chunk: string) {
  const lines = chunk.split("\n");
  const messages: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data: ") && !line.startsWith("data: [DONE]")) {
      const data = line.slice(6);
      const content: string = JSON.parse(data).choices[0].delta.content;
      if (content) {
        messages.push(content);
      }
    }
  }

  return messages;
}
