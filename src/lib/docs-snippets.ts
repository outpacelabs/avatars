/**
 * Raw code snippets for the /docs page, keyed so the server page can
 * syntax-highlight them with Shiki and pass the HTML to the client docs.
 */
export const SNIPPETS = {
	usage: {
		lang: "tsx",
		code: `import { GradientAvatar } from "@outpacelabs/avatars";

export function Avatar({ user }) {
  return <GradientAvatar seed={user.id} size={96} />;
}`,
	},
	examples: {
		lang: "tsx",
		code: `<GradientAvatar seed="studio" size={84} />            // circle
<GradientAvatar seed="studio" size={84} radius={18} /> // rounded square
<GradientAvatar seed="studio" size={84} radius={0} />  // square`,
	},
	patterns: {
		lang: "tsx",
		code: `<GradientAvatar seed="studio" size={84} />                  // mesh (default)
<GradientAvatar seed="studio" size={84} pattern="dither" /> // dither`,
	},
	colors: {
		lang: "tsx",
		code: `// Your brand palette instead of the seed-derived harmony.
<GradientAvatar seed={user.id} colors={["#4f46e5", "#06b6d4", "#ec4899"]} />`,
	},
	p3: {
		lang: "tsx",
		code: `// Wide-gamut Display P3, more vivid on capable screens.
<GradientAvatar seed="studio" size={84} p3 />`,
	},
	engine: {
		lang: "tsx",
		code: `import { gradientToDataURL, generatePalette } from "@outpacelabs/avatars";

// A 512×512 PNG data URL, no React required.
const src = gradientToDataURL("jane@example.com", { size: 512 });

// Just the colors behind a seed.
const { colors, harmony } = generatePalette("jane@example.com");`,
	},
} as const;

export type SnippetKey = keyof typeof SNIPPETS;

/** Package-manager install commands for the shadcn-style switcher. */
export const INSTALL = [
	{ id: "pnpm", command: "pnpm add @outpacelabs/avatars" },
	{ id: "npm", command: "npm i @outpacelabs/avatars" },
	{ id: "yarn", command: "yarn add @outpacelabs/avatars" },
	{ id: "bun", command: "bun add @outpacelabs/avatars" },
] as const;
