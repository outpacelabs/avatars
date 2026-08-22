/**
 * Plugin main thread.
 *
 * It owns the document and nothing else. The UI decides what an avatar looks
 * like and sends over a finished plan or a finished PNG; this file turns that
 * into layers, puts them where the user is looking, and selects them.
 */

import type { MainMessage, Selected, Settings, UiMessage } from "./messages.ts";
import {
	createImageAvatar,
	createLayerAvatar,
	imagePaint,
	placeInViewport,
	row,
} from "./nodes.ts";

const UI_WIDTH = 352;
const UI_HEIGHT = 640;
const SETTINGS_KEY = "settings";
/** Space between avatars when several are inserted at once. */
const GAP = 24;

figma.showUI(__html__, {
	width: UI_WIDTH,
	height: UI_HEIGHT,
	title: "Avatars",
	themeColors: false,
});

function post(message: MainMessage): void {
	figma.ui.postMessage(message);
}

/** What the UI needs to know about the selection: a name and a size. */
function selection(): Selected[] {
	const out: Selected[] = [];
	for (const node of figma.currentPage.selection) {
		// Only nodes that can take a paint are worth offering to fill.
		if (!("fills" in node) || !("width" in node)) continue;
		out.push({
			id: node.id,
			name: node.name,
			width: Math.round(node.width),
			height: Math.round(node.height),
		});
	}
	return out;
}

/** Put a finished node on the page, in view, and selected. */
function land(node: SceneNode, message: string): void {
	placeInViewport(node);
	figma.currentPage.selection = [node];
	figma.notify(message);
}

/** One avatar goes in on its own; several go in as a tidy row. */
function group(nodes: SceneNode[]): SceneNode {
	return nodes.length === 1 ? nodes[0] : row(nodes, GAP);
}

const plural = (n: number, one: string) => (n === 1 ? one : `${n} ${one}s`);

figma.on("selectionchange", () => {
	post({ type: "selection", selection: selection() });
});

figma.ui.onmessage = async (message: UiMessage) => {
	try {
		switch (message.type) {
			case "insert-layers": {
				const nodes = message.avatars.map((avatar) =>
					createLayerAvatar(avatar, message.frame),
				);
				land(group(nodes), `Added ${plural(nodes.length, "avatar")}`);
				break;
			}
			case "insert-images": {
				const nodes = message.avatars.map((avatar) =>
					createImageAvatar(avatar, message.frame),
				);
				land(group(nodes), `Added ${plural(nodes.length, "avatar")}`);
				break;
			}
			case "fill-selection": {
				let filled = 0;
				for (const item of message.items) {
					const node = await figma.getNodeByIdAsync(item.id);
					if (!node || !("fills" in node)) continue;
					node.fills = [imagePaint(item.bytes)];
					filled++;
				}
				figma.notify(
					filled
						? `Filled ${plural(filled, "layer")}`
						: "Nothing in the selection can take a fill",
					{ error: filled === 0 },
				);
				break;
			}
			case "save-settings":
				await figma.clientStorage.setAsync(SETTINGS_KEY, message.settings);
				break;
			case "notify":
				figma.notify(message.message, { error: message.error === true });
				break;
		}
	} catch (error) {
		figma.notify(error instanceof Error ? error.message : String(error), {
			error: true,
		});
	}
};

(async () => {
	const saved = (await figma.clientStorage.getAsync(SETTINGS_KEY)) as
		| Settings
		| undefined;
	post({ type: "init", settings: saved ?? null, selection: selection() });
})();
