import { defineConfig } from "tsdown";

// Library build: ES module and CommonJS, with type declarations, for
// browsers and Node.js.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "neutral",
  dts: true,
  clean: true,
});
