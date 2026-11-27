import { defineConfig } from "tsdown";

// Library build: ES module and CommonJS, with type declarations, for
// browsers and Node.js.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "neutral",
  dts: true,
  // Overwrite dist/ in place instead of emptying it first: the webapp links
  // this package, and its dev server fails to resolve it (and keeps failing)
  // if a rebuild, e.g. npm's "prepare" on installing the webapp, happens to
  // run while dist/ is empty. The output file names are always the same.
  clean: false,
});
