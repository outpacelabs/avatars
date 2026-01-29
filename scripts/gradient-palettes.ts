/**
 * Procedural Color Palette Generator for Mesh Gradient Avatars
 *
 * Uses HSL color space with color harmony rules to generate
 * beautiful, varied gradient palettes.
 *
 * Based on research from:
 * - https://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette
 * - https://samdriver.xyz/article/simple-procedural-palette
 */

export interface GradientPalette {
	id: number;
	colors: string[];
	harmony: string;
}

// ============================================================================
// Seeded Random Number Generator
// ============================================================================

/**
 * Create a seeded random number generator for reproducible results.
 * Uses mulberry32 algorithm.
 */
function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s += 0x6d2b79f5;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ============================================================================
// Color Conversion Utilities
// ============================================================================

/**
 * Convert HSL to Hex color string.
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 */
function hslToHex(h: number, s: number, l: number): string {
	// Normalize hue to 0-360
	h = ((h % 360) + 360) % 360;
	s = Math.max(0, Math.min(100, s)) / 100;
	l = Math.max(0, Math.min(100, l)) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;

	if (h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}

	const toHex = (n: number) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// ============================================================================
// Color Harmony Functions
// ============================================================================

type HarmonyType =
	| "analogous"
	| "triadic"
	| "splitComplementary"
	| "tetradic"
	| "complementary";

const HARMONY_TYPES: HarmonyType[] = [
	"analogous",
	"triadic",
	"splitComplementary",
	"tetradic",
	"complementary",
];

/**
 * Generate hues based on color harmony rules.
 */
function getHarmonyHues(baseHue: number, harmony: HarmonyType): number[] {
	switch (harmony) {
		case "analogous":
			// Colors adjacent on the wheel (30° apart)
			return [baseHue, baseHue + 30, baseHue + 60, baseHue - 30];
		case "triadic":
			// Three colors equally spaced (120° apart)
			return [baseHue, baseHue + 120, baseHue + 240];
		case "splitComplementary":
			// Base + two colors adjacent to complement
			return [baseHue, baseHue + 150, baseHue + 210];
		case "tetradic":
			// Four colors in rectangle pattern
			return [baseHue, baseHue + 90, baseHue + 180, baseHue + 270];
		case "complementary":
			// Opposite colors with variations
			return [baseHue, baseHue + 180, baseHue + 20, baseHue + 200];
		default:
			return [baseHue, baseHue + 120, baseHue + 240];
	}
}

// ============================================================================
// Palette Generation
// ============================================================================

/**
 * Generate a harmonious color palette from a seed.
 */
function generatePalette(seed: number): GradientPalette {
	const random = seededRandom(seed);

	// Pick random base hue (0-360) using golden angle for better distribution
	const goldenAngle = 137.5;
	const baseHue = (seed * goldenAngle) % 360;

	// Pick a harmony type based on seed
	const harmonyIndex = Math.floor(random() * HARMONY_TYPES.length);
	const harmony = HARMONY_TYPES[harmonyIndex];

	// Generate hues based on harmony
	const hues = getHarmonyHues(baseHue, harmony);

	// Convert to colors with varied saturation/lightness
	const colors = hues.map((hue) => {
		// Saturation: 75-100% (vibrant, punchy colors)
		const saturation = 75 + random() * 25;
		// Lightness: 50-70% (bright but not washed out)
		const lightness = 50 + random() * 20;
		return hslToHex(hue, saturation, lightness);
	});

	return {
		id: seed,
		colors,
		harmony,
	};
}

// ============================================================================
// Export Generated Palettes
// ============================================================================

export const TOTAL_GRADIENTS = 50;

// Generate 50 unique palettes
export const GRADIENT_PALETTES: GradientPalette[] = Array.from(
	{ length: TOTAL_GRADIENTS },
	(_, i) => generatePalette(i),
);

// For debugging: log palette distribution
if (
	typeof process !== "undefined" &&
	process.argv[1]?.includes("gradient-palettes")
) {
	const harmonyCounts: Record<string, number> = {};
	GRADIENT_PALETTES.forEach((p) => {
		harmonyCounts[p.harmony] = (harmonyCounts[p.harmony] || 0) + 1;
	});
	console.log("Harmony distribution:", harmonyCounts);
	console.log("Sample palettes:", GRADIENT_PALETTES.slice(0, 5));
}
