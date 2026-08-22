/**
 * The contract between the plugin UI and the plugin main thread.
 *
 * The UI iframe has a DOM and a canvas, so it does the drawing: it builds the
 * layer plan and it renders the PNG. The main thread has the document, so it
 * only creates nodes. Everything that crosses between them is here.
 */

import type { Pattern } from "../../avatars/src/engine.ts";
import type { Op } from "./plan.ts";

export type Shape = "circle" | "squircle" | "rounded" | "square";
export type Output = "layers" | "image";

/** How the avatar frame is cut. */
export interface FrameStyle {
	shape: Shape;
	/** Corner radius in pixels. Used by `rounded` and `squircle`. */
	radius: number;
	/** Corner smoothing, 0–1. Figma's own squircle. */
	smoothing: number;
}

/** One avatar as native layers. */
export interface LayerAvatar {
	seed: string;
	size: number;
	blur: number;
	ops: Op[];
}

/** One avatar as a PNG, drawn by the same renderer the web site uses. */
export interface ImageAvatar {
	seed: string;
	size: number;
	bytes: Uint8Array;
}

/** A node the user has selected, as the UI needs to see it. */
export interface Selected {
	id: string;
	name: string;
	width: number;
	height: number;
}

/** Everything the panel remembers between runs. */
export interface Settings {
	seeds: string;
	pattern: Pattern;
	shape: Shape;
	size: number;
	radius: number;
	smoothing: number;
	output: Output;
	palette: string;
	usePalette: boolean;
	seedFromName: boolean;
}

export type UiMessage =
	| { type: "insert-layers"; frame: FrameStyle; avatars: LayerAvatar[] }
	| { type: "insert-images"; frame: FrameStyle; avatars: ImageAvatar[] }
	| { type: "fill-selection"; items: { id: string; bytes: Uint8Array }[] }
	| { type: "save-settings"; settings: Settings }
	| { type: "notify"; message: string; error?: boolean };

export type MainMessage =
	| { type: "init"; settings: Settings | null; selection: Selected[] }
	| { type: "selection"; selection: Selected[] };
