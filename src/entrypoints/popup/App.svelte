<script lang="ts">
  import { onMount } from "svelte";
  import { ModelOption } from "../../utils/config";

  let model = $state(ModelOption.GEMINI);
  const summary = $state([""]);

  function displaySummary(text: string) {
    for (const c of text) {
      if (c === ";") {
        summary.push("");
      } else {
        const isEmptyLine = summary[summary.length - 1].trim() === "";
        summary[summary.length - 1] += isEmptyLine ? c.toUpperCase() : c;
      }
    }
  }

  function runSummary() {
    const port = browser.runtime.connect(undefined, { name: "popup" });
    port.postMessage({ content: "Sunmarize" });

    const handleMessage = (msg: { final: boolean; content?: string }) => {
      if (msg.final) {
        cleanup();
      } else if (msg.content !== undefined) {
        displaySummary(msg.content);
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
    const storageModel = (await browser.storage.local.get(["model"])).model as ModelOption;
    if (!storageModel) {
      await browser.storage.local.set({ model: ModelOption.GEMINI });
    } else {
      model = storageModel;
    }
  }

  onMount(() => {
    loadModel();
    const cleanup = runSummary();
    return cleanup;
  });
</script>

<main class="w-[450px] h-[450px] p-8 flex flex-col justify-start text-base">
  <ul class="flex-1 list-disc list-inside overflow-y-auto">
    {#each summary as point}
      <li>{point}</li>
    {/each}
  </ul>

  <div class="flex gap-2 self-center">
    {#each [ModelOption.GEMINI, ModelOption.OPENAI] as modelOption}
      <input
        type="radio"
        id={modelOption}
        name="model"
        value={modelOption}
        checked={modelOption === model}
        onclick={async (e) => {
          summary.length = 0;
          const value = (e.target as HTMLInputElement)?.value as ModelOption;
          await browser.storage.local.set({ model: value });
          model = value;
          runSummary();
        }}
      />
      <label for={modelOption} class="capitalize">{modelOption}</label>
    {/each}
  </div>
</main>
