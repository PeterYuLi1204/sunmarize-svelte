<script lang="ts">
  import logo from "../../assets/logo.png";
  import { onMount } from "svelte";
  import { ModelOption } from "../../utils/interfaces";
  import { DEFAULT_MODEL } from "../../utils/config";

  let model = $state(DEFAULT_MODEL);
  let summary = $state([""]);

  function displaySummary(text: string) {
    for (const c of text) {
      if (c === "\n") {
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

    port.onMessage.addListener(handleMessage);

    const cleanup = () => {
      port.onMessage.removeListener(handleMessage);
      port.disconnect?.();
    };

    return cleanup;
  }

  async function loadModel() {
    const storageModel = (await browser.storage.local.get(["model"])).model as ModelOption;
    if (!storageModel) {
      await browser.storage.local.set({ model: DEFAULT_MODEL });
    } else {
      model = storageModel;
    }
  }

  function handleModelChange(e: Event) {
    const value = (e.target as HTMLInputElement)?.value as ModelOption;
    summary = [""];
    model = value;
    browser.storage.local.set({ model: value });
    runSummary();
  }

  onMount(() => {
    loadModel();
    const cleanup = runSummary();
    return cleanup;
  });
</script>

<main class="text-base w-[500px] h-[500px] flex flex-col justify-start">
  <div class="flex-1 overflow-y-auto">
    <div class="flex items-center gap-2 w-full sticky top-0 backdrop-blur-lg px-8 py-3">
      <img src={logo} alt="Sunmarize Logo" class="w-18 h-18" />
      <h1 class="text-2xl">Sunmarize</h1>
    </div>

    <ul class="list-disc list-inside px-8">
      {#each summary as point}
        <li>{point}</li>
      {/each}
    </ul>
  </div>

  <div class="flex justify-center gap-2 w-full py-2">
    {#each [ModelOption.OPENAI, ModelOption.GEMINI] as modelOption}
      <input
        type="radio"
        id={modelOption}
        name="model"
        value={modelOption}
        checked={modelOption === model}
        onchange={handleModelChange}
      />
      <label for={modelOption} class="capitalize">{modelOption}</label>
    {/each}
  </div>
</main>
