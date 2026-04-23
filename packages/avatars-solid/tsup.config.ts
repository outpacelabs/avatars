import { solidPlugin } from "esbuild-plugin-solid";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.tsx" },
	format: ["esm"],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	external: ["solid-js", "@outpacelabs/avatars"],
	esbuildPlugins: [solidPlugin()],
});
