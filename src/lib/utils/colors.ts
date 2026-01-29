/**
 * User Color Utilities
 *
 * Generates consistent colors for users based on their ID.
 * Used for cursor colors in collaborative features.
 */

// Curated palette of distinct, visible colors (avoiding too light/dark)
const CURSOR_COLORS = [
	"#F87171", // Red
	"#FB923C", // Orange
	"#FBBF24", // Amber
	"#A3E635", // Lime
	"#34D399", // Emerald
	"#22D3EE", // Cyan
	"#60A5FA", // Blue
	"#A78BFA", // Violet
	"#F472B6", // Pink
	"#E879F9", // Fuchsia
] as const;

/**
 * Simple hash function for strings.
 * Returns a consistent number for a given string.
 */
export function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

/**
 * Get a consistent color for a user ID.
 * The same ID will always return the same color.
 */
export function getUserColor(userId: string): string {
	const index = hashString(userId) % CURSOR_COLORS.length;
	return CURSOR_COLORS[index];
}

/**
 * Get all available cursor colors.
 */
export function getCursorColors(): readonly string[] {
	return CURSOR_COLORS;
}

/**
 * Get a color by index (wraps around if out of bounds).
 */
export function getColorByIndex(index: number): string {
	return CURSOR_COLORS[Math.abs(index) % CURSOR_COLORS.length];
}
