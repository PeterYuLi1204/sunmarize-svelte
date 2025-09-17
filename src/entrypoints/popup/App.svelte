<script lang="ts">
  import logo from "../../assets/logo.png";
  import ModelSelector from "./ModelSelector.svelte";

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

  onMount(() => {
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
    <ModelSelector
      onModelChange={() => {
        summary = [""];
        runSummary();
      }}
    />
  </div>
</main>
