<script lang="ts">
  import { onMount } from "svelte";
  import { ModelOption } from "../../utils/config";

  let summary = $state("");

  function runSummary() {
    const port = browser.runtime.connect(undefined, { name: "popup" });
    port.postMessage({ content: "Sunmarize" });

    const handleMessage = (msg: any) => {
      if (msg.final) {
        cleanup();
      } else if (msg.content !== undefined) {
        summary += msg.content;
      }
    };

    const cleanup = () => {
      port.onMessage.removeListener(handleMessage);
      port.disconnect?.();
    };

    port.onMessage.addListener(handleMessage);

    return cleanup;
  }

  async function loadModel() {
    let model: ModelOption = (await browser.storage.local.get(["model"])).model;
    if (!model) {
      await browser.storage.local.set({ model: ModelOption.OPENAI });
      model = ModelOption.OPENAI;
    }
  }

  onMount(() => {
    loadModel();
    const cleanup = runSummary();
    return cleanup;
  });
</script>

<main class="min-w-[450px] min-h-[450px] p-8 flex flex-col items-center justify-start">
  <div>{summary}</div>
</main>
