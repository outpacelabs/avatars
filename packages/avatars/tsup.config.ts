import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.tsx" },
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	// Ships as one self-contained package; only React is external.
	external: ["react", "react-dom"],
});
