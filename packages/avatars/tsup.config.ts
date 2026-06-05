import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.tsx" },
	format: ["esm", "cjs"],
	// `resolve` inlines the engine's type declarations so the .d.ts has no
	// external reference to @outpacelabs/gradient-avatars (it's bundled in).
	dts: { resolve: ["@outpacelabs/gradient-avatars"] },
	clean: true,
	sourcemap: true,
	treeshake: true,
	// The gradient engine is bundled in so this ships as one self-contained
	// package — consumers only install @outpacelabs/gradient-avatars-react.
	external: ["react", "react-dom"],
	noExternal: ["@outpacelabs/gradient-avatars"],
});
