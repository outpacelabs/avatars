/**
 * Plugin panel.
 *
 * The iframe is the only half of a Figma plugin with a DOM, so all the
 * drawing happens here: the live preview, the layer plan, and the PNG. The
 * main thread is handed finished work and only makes nodes out of it.
 */

// The site's corner-smoothing path, so the squircle preview here is the same
// curve Figma draws from `cornerSmoothing`. One derivation, two surfaces.
import { squirclePath } from "../../../../src/lib/utils/squircle.ts";
import { type Pattern, renderGradient } from "../../../avatars/src/engine.ts";
import type {
	MainMessage,
	Output,
	Selected,
	Settings,
	Shape,
	UiMessage,
} from "../messages.ts";
import { buildPlan } from "../plan.ts";

const DEFAULTS: Settings = {
	seeds: "jane@example.com\nacme\noutpace",
	pattern: "mesh",
	shape: "circle",
	size: 96,
	radius: 24,
	smoothing: 0.6,
	output: "layers",
	palette: "",
	usePalette: false,
	seedFromName: true,
};

/** More than this in one go and a Figma file stops being a pleasure. */
const MAX_SEEDS = 24;
/** The preview shows true size up to here, then it stops growing. */
const MAX_PREVIEW = 128;
/** Other seeds, shown small beneath the first one. */
const STRIP_SIZE = 26;
const MAX_STRIP = 8;

const state: Settings = { ...DEFAULTS };
let selection: Selected[] = [];

/* ── elements ── */

const el = <T extends HTMLElement>(id: string) =>
	document.getElementById(id) as T;

const hero = el<HTMLDivElement>("hero");
const strip = el<HTMLDivElement>("strip");
const seedsInput = el<HTMLTextAreaElement>("seeds");
const sizeInput = el<HTMLInputElement>("size");
const sizeValue = el<HTMLSpanElement>("size-value");
const radiusField = el<HTMLDivElement>("radius-field");
const radiusInput = el<HTMLInputElement>("radius");
const radiusValue = el<HTMLSpanElement>("radius-value");
const paletteInput = el<HTMLInputElement>("palette");
const usePaletteInput = el<HTMLInputElement>("use-palette");
const seedFromNameInput = el<HTMLInputElement>("seed-from-name");
const outputHint = el<HTMLSpanElement>("output-hint");
const insertButton = el<HTMLButtonElement>("insert");
const fillButton = el<HTMLButtonElement>("fill");

/* ── talking to the document ── */

function post(message: UiMessage): void {
	parent.postMessage({ pluginMessage: message }, "*");
}

function notify(message: string, error = false): void {
	post({ type: "notify", message, error });
}

let saveTimer: number | undefined;
function save(): void {
	window.clearTimeout(saveTimer);
	saveTimer = window.setTimeout(() => {
		post({ type: "save-settings", settings: { ...state } });
	}, 400);
}

/* ── reading the controls ── */

function seeds(): string[] {
	return state.seeds
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, MAX_SEEDS);
}

function palette(): string[] | undefined {
	if (!state.usePalette) return undefined;
	const found = state.palette.match(/#?[0-9a-f]{6}\b|#?[0-9a-f]{3}\b/gi);
	return found?.length ? found : undefined;
}

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 10);
}

/* ── preview ── */

/** Cut a preview box to the chosen shape, at the size it is shown. */
function shapeBox(box: HTMLElement, px: number): void {
	const radius = Math.min(px / 2, state.radius * (px / state.size));
	box.style.width = `${px}px`;
	box.style.height = `${px}px`;
	box.style.clipPath = "none";
	box.style.borderRadius = "0";
	if (state.shape === "circle") {
		box.style.borderRadius = "50%";
	} else if (state.shape === "rounded") {
		box.style.borderRadius = `${radius}px`;
	} else if (state.shape === "squircle") {
		box.style.clipPath = `path("${squirclePath({
			width: px,
			height: px,
			radius,
			smoothing: state.smoothing,
		})}")`;
	}
}

function paint(box: HTMLElement, seed: string, px: number): void {
	shapeBox(box, px);
	const canvas = document.createElement("canvas");
	// Drawn above the display size so the blur stays smooth, while the level
	// of detail follows the size the avatar will really be.
	const resolution = Math.max(128, Math.min(512, Math.round(px * 3)));
	canvas.width = resolution;
	canvas.height = resolution;
	renderGradient(canvas, seed, {
		pattern: state.pattern,
		colors: palette(),
		displaySize: state.size,
	});
	box.replaceChildren(canvas);
}

function renderPreview(): void {
	const list = seeds();
	if (!list.length) {
		hero.replaceChildren();
		hero.style.width = "0px";
		strip.replaceChildren();
		return;
	}
	paint(hero, list[0], Math.min(state.size, MAX_PREVIEW));

	strip.replaceChildren();
	for (const seed of list.slice(1, MAX_STRIP + 1)) {
		const box = document.createElement("div");
		box.className = "shape";
		box.title = seed;
		paint(box, seed, STRIP_SIZE);
		strip.append(box);
	}
}

/* ── the two ways out ── */

function pngSize(displaySize: number): number {
	return Math.max(256, Math.min(1024, Math.round(displaySize * 2)));
}

async function png(seed: string, displaySize: number): Promise<Uint8Array> {
	const canvas = document.createElement("canvas");
	canvas.width = pngSize(displaySize);
	canvas.height = canvas.width;
	renderGradient(canvas, seed, {
		pattern: state.pattern,
		colors: palette(),
		displaySize,
	});
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (!blob) throw new Error("The avatar could not be rendered");
	return new Uint8Array(await blob.arrayBuffer());
}

function frameStyle() {
	return {
		shape: state.shape,
		radius: state.radius,
		smoothing: state.smoothing,
	};
}

async function insert(): Promise<void> {
	const list = seeds();
	if (!list.length) {
		notify("Add at least one seed", true);
		return;
	}
	if (state.output === "layers") {
		post({
			type: "insert-layers",
			frame: frameStyle(),
			avatars: list.map((seed) => {
				const plan = buildPlan({
					seed,
					pattern: state.pattern,
					size: state.size,
					colors: palette(),
				});
				return { seed, size: plan.size, blur: plan.blur, ops: plan.ops };
			}),
		});
		return;
	}
	const avatars = [];
	for (const seed of list) {
		avatars.push({
			seed,
			size: state.size,
			bytes: await png(seed, state.size),
		});
	}
	post({ type: "insert-images", frame: frameStyle(), avatars });
}

/**
 * Fill what the user selected. An avatar goes into any shape here, whatever
 * its geometry, so this path is always an image. The seed comes from each
 * layer's own name by default, which is how a page of placeholders named
 * after real people fills itself in one click.
 */
async function fillSelection(): Promise<void> {
	const list = seeds();
	if (!state.seedFromName && !list.length) {
		notify("Add at least one seed", true);
		return;
	}
	const items = [];
	for (let i = 0; i < selection.length; i++) {
		const node = selection[i];
		const seed = state.seedFromName ? node.name : list[i % list.length];
		const displaySize = Math.max(1, Math.round(node.width));
		items.push({ id: node.id, bytes: await png(seed, displaySize) });
	}
	post({ type: "fill-selection", items });
}

/* ── wiring ── */

function segmented<T extends string>(
	id: string,
	options: Array<{ value: T; label: string }>,
	set: (value: T) => void,
): void {
	const host = el<HTMLDivElement>(id);
	host.replaceChildren();
	for (const option of options) {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = option.label;
		button.dataset.value = option.value;
		button.addEventListener("click", () => {
			set(option.value);
			sync();
			save();
		});
		host.append(button);
	}
}

function syncSegmented(id: string, value: string): void {
	const buttons = Array.from(el<HTMLDivElement>(id).children);
	for (const button of buttons) {
		const on = (button as HTMLButtonElement).dataset.value === value;
		button.setAttribute("aria-pressed", on ? "true" : "false");
	}
}

/** Push the whole of `state` back out to the panel. */
function sync(): void {
	if (seedsInput.value !== state.seeds) seedsInput.value = state.seeds;
	syncSegmented("pattern", state.pattern);
	syncSegmented("shape", state.shape);
	syncSegmented("output", state.output);

	sizeInput.value = String(state.size);
	sizeValue.textContent = `${state.size} px`;

	const maxRadius = Math.round(state.size / 2);
	radiusInput.max = String(maxRadius);
	state.radius = Math.min(state.radius, maxRadius);
	radiusInput.value = String(state.radius);
	radiusValue.textContent = `${state.radius} px`;
	radiusField.style.display =
		state.shape === "rounded" || state.shape === "squircle" ? "flex" : "none";

	usePaletteInput.checked = state.usePalette;
	paletteInput.disabled = !state.usePalette;
	paletteInput.style.opacity = state.usePalette ? "1" : "0.4";
	if (paletteInput.value !== state.palette) paletteInput.value = state.palette;
	seedFromNameInput.checked = state.seedFromName;

	const list = seeds();
	if (state.output === "layers") {
		const layers = list.length
			? buildPlan({
					seed: list[0],
					pattern: state.pattern,
					size: state.size,
					colors: palette(),
				}).ops.length
			: 0;
		outputHint.textContent = `Native shapes, editable. ${layers} layers per avatar.`;
	} else {
		outputHint.textContent = `A ${pngSize(state.size)} px PNG, exactly what the web renders.`;
	}

	fillButton.disabled = selection.length === 0;
	fillButton.textContent = selection.length
		? `Fill ${selection.length} selected`
		: "Fill selection";
	insertButton.textContent =
		list.length > 1 ? `Insert ${list.length}` : "Insert";

	renderPreview();
}

segmented<Pattern>(
	"pattern",
	[
		{ value: "mesh", label: "Mesh" },
		{ value: "dither", label: "Dither" },
	],
	(value) => {
		state.pattern = value;
	},
);

segmented<Shape>(
	"shape",
	[
		{ value: "circle", label: "Circle" },
		{ value: "squircle", label: "Squircle" },
		{ value: "rounded", label: "Rounded" },
		{ value: "square", label: "Square" },
	],
	(value) => {
		state.shape = value;
	},
);

segmented<Output>(
	"output",
	[
		{ value: "layers", label: "Layers" },
		{ value: "image", label: "Image" },
	],
	(value) => {
		state.output = value;
	},
);

seedsInput.addEventListener("input", () => {
	state.seeds = seedsInput.value;
	sync();
	save();
});

el<HTMLButtonElement>("shuffle").addEventListener("click", () => {
	const count = Math.max(1, seeds().length);
	state.seeds = Array.from({ length: count }, randomSeed).join("\n");
	sync();
	save();
});

sizeInput.addEventListener("input", () => {
	state.size = Number(sizeInput.value);
	sync();
	save();
});

radiusInput.addEventListener("input", () => {
	state.radius = Number(radiusInput.value);
	sync();
	save();
});

paletteInput.addEventListener("input", () => {
	state.palette = paletteInput.value;
	sync();
	save();
});

usePaletteInput.addEventListener("change", () => {
	state.usePalette = usePaletteInput.checked;
	sync();
	save();
});

seedFromNameInput.addEventListener("change", () => {
	state.seedFromName = seedFromNameInput.checked;
	sync();
	save();
});

const run = (job: () => Promise<void>) => () => {
	job().catch((error: unknown) => {
		notify(error instanceof Error ? error.message : String(error), true);
	});
};

insertButton.addEventListener("click", run(insert));
fillButton.addEventListener("click", run(fillSelection));

window.addEventListener("message", (event: MessageEvent) => {
	const message = event.data?.pluginMessage as MainMessage | undefined;
	if (!message) return;
	if (message.type === "init") {
		if (message.settings) Object.assign(state, DEFAULTS, message.settings);
		selection = message.selection;
		sync();
		return;
	}
	if (message.type === "selection") {
		selection = message.selection;
		sync();
	}
});

sync();
