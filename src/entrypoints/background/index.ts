import { retrieveText, summarize } from "@/entrypoints/background/helpers.js";

async function handleSunmarize(port: Browser.runtime.Port) {
  try {
    const articleText = await retrieveText();
    await summarize(articleText, port);
  } catch (error) {
    console.error(error);
  } finally {
    port.postMessage({ final: true });
  }
}

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg: { content: string }) => {
      if (msg.content === "Sunmarize") {
        await handleSunmarize(port);
      }
    });
  });
});
