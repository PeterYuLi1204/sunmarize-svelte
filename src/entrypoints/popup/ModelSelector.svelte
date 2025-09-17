<script lang="ts">
  import { ModelOption } from "../../utils/interfaces";
  import { onMount } from "svelte";
  import { DEFAULT_MODEL } from "../../utils/config";

  let { onModelChange } = $props<{ onModelChange: () => void }>();
  let model = $state(DEFAULT_MODEL);

  async function loadModel() {
    const storageModel = (await browser.storage.local.get(["model"])).model as ModelOption;
    if (!storageModel) {
      await browser.storage.local.set({ model: DEFAULT_MODEL });
    } else {
      model = storageModel;
    }
  }

  function handleModelChange() {
    browser.storage.local.set({ model });
    onModelChange();
  }

  onMount(() => {
    loadModel();
  });
</script>

{#each Object.values(ModelOption) as modelOption}
  <label>
    <input
      type="radio"
      id={modelOption}
      name="model"
      value={modelOption}
      bind:group={model}
      onchange={handleModelChange}
    />
    <span class="capitalize">{modelOption}</span>
  </label>
{/each}
