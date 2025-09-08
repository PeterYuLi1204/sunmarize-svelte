import { GEMINI_URL, OPENAI_URL } from "@/utils/config";
import { ModelOption } from "@/utils/interfaces";

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

export async function getModelUrl() {
  const model = await browser.storage.local.get("model");
  if (model.model === ModelOption.GEMINI) {
    return GEMINI_URL;
  } else {
    return OPENAI_URL;
  }
}

export async function summarize(text: string, port: Browser.runtime.Port) {
  const apiURL = await getModelUrl();
  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to summarize text. ${response.statusText}`);
  }

  const decoderStream = new TextDecoderStream("utf-8");
  const reader = response.body.pipeThrough(decoderStream).getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    port.postMessage({ final: false, content: value });
  }
}
