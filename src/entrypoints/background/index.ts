import { retrieveText, summarize, getSelectedModel } from "@/entrypoints/background/helpers.js";

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg: { content: string }) => {
      if (msg.content === "Sunmarize") {
        try {
          const articleText = await retrieveText();
          await summarize(articleText, await getSelectedModel(), port);
          port.postMessage({ final: true });
        } catch (error) {
          console.error(error);
          port.postMessage({
            final: true,
            content: (error as Error).message,
          });
        }
      }
    });
  });
});
