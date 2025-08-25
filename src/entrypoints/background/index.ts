import { retrieveText, summarize, getSelectedModel, streamResults } from "@/entrypoints/background/helpers.js";

export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
      if (msg.content === "Sunmarize") {
        try {
          const articleText = await retrieveText();
          const reader = await summarize(articleText, port, await getSelectedModel());
          streamResults(reader, port);
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
