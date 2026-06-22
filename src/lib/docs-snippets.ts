/**
 * Raw code snippets for the /docs page, keyed so the server page can
 * syntax-highlight them with Shiki and pass the HTML to the client docs.
 */
export const SNIPPETS = {
	installOne: { lang: "bash", code: "npm i @outpacelabs/avatars" },
	installManagers: {
		lang: "bash",
		code: `npm i @outpacelabs/avatars
pnpm add @outpacelabs/avatars
yarn add @outpacelabs/avatars
bun add @outpacelabs/avatars`,
	},
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
