import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  manifest: {
    name: "Sunmarize",
    description: "Summarize web pages with ease",
    version: "1.0.0",
    permissions: ["activeTab", "scripting", "storage"],
  }
});
