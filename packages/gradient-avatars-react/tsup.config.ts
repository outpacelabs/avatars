import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.tsx" },
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	external: ["react", "react-dom", "@outpacelabs/gradient-avatars"],
});
