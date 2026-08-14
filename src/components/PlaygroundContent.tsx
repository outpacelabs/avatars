"use client";

import {
	confirm as confirmSound,
	copy as copySound,
	deny as denySound,
	tap as tapSound,
} from "@outpacelabs/audio";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { OutpaceLogo } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";
import {
	generatePaletteX,
	HUE_RANGES,
	type HueRange,
	MOODS_X,
	type MoodX,
} from "@/lib/avatars/colorx";
import { DEFORMS, type DeformType, drawDeformed } from "@/lib/avatars/deform";
import type { Harmony } from "@/lib/avatars/mesh-gradient";

/*
 * /play, an extended playground for the deformation engine. A large live
 * preview on the left, a full control panel on the right (seed, deformation
 * type, amount, scale, detail, blur, harmony), and a strip of random presets
 * to riff on. Everything is deterministic from the seed + settings, so any
 * look you land on is reproducible and exportable.
 */

const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

/** Live preview render; a square that cover-fills the framed area at any aspect.
 *  Smooth gradients upscale cleanly, so this stays modest for snappy edits. */
const FULL_RES = 720;
/** Square source resolution the export cover-crops from. */
const EXPORT_SRC = 1600;

/** Output formats: the preview frame's aspect + the exported pixel size. */
type Format = "square" | "circle" | "landscape" | "portrait";

const FORMATS: { id: Format; label: string }[] = [
	{ id: "square", label: "Square" },
	{ id: "circle", label: "Circle" },
	{ id: "landscape", label: "Landscape" },
	{ id: "portrait", label: "Portrait" },
];

/** Export pixel dimensions per format (portrait/landscape are wallpaper sizes). */
const FORMAT_DIMS: Record<Format, { w: number; h: number }> = {
	square: { w: 1024, h: 1024 },
	circle: { w: 1024, h: 1024 },
	landscape: { w: 2560, h: 1440 },
	portrait: { w: 1170, h: 2532 },
};

const formatAspect = (f: Format) => FORMAT_DIMS[f].w / FORMAT_DIMS[f].h;

const HARMONIES: { id: Harmony | "auto"; label: string }[] = [
	{ id: "auto", label: "Auto" },
	{ id: "analogous", label: "Analogous" },
	{ id: "complementary", label: "Complementary" },
	{ id: "splitComplementary", label: "Split" },
	{ id: "triadic", label: "Triadic" },
	{ id: "tetradic", label: "Tetradic" },
];

interface Settings {
	seed: string;
	deform: DeformType;
	amount: number;
	scale: number;
	detail: number;
	blur: number;
	harmony: Harmony | "auto";
	mood: MoodX;
	hueRange: HueRange;
	p3: boolean;
	format: Format;
}

const DEFAULTS: Settings = {
	seed: "aurora",
	deform: "storm",
	amount: 0.72,
	scale: 3,
	detail: 4,
	blur: 0,
	harmony: "auto",
	mood: "vivid",
	hueRange: "full",
	p3: true,
	format: "square",
};

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 9);
}

/** Deterministic first presets so the server and first client render match;
 *  the dice reshuffles to random ones after mount. */
function seededPresets(count: number): string[] {
	let s = 0x9e3779b9;
	return Array.from({ length: count }, () => {
		s = (Math.imul(s ^ (s >>> 15), s | 1) >>> 0) >>> 0;
		return (s >>> 0).toString(36).slice(0, 6);
	});
}

function optionsFor(s: Settings) {
	return {
		deform: s.deform,
		amount: s.amount,
		scale: s.scale,
		detail: s.detail,
		paletteX: generatePaletteX(s.seed, {
			harmony: s.harmony === "auto" ? undefined : s.harmony,
			mood: s.mood,
			hueRange: s.hueRange,
		}),
	};
}

/** Crossfade between gradient states, a small state change (duration-small-state,
 *  ease-out). Skipped on slider drags, which redraw continuously. */
const XFADE_MS = 240;

/**
 * Fills its positioned parent with the deformed gradient (cover). When a
 * DISCRETE setting flips (seed, deform, palette, format space) the previous
 * frame is snapshot into an overlay and faded out over the new one, so state
 * changes crossfade instead of snapping. Continuous edits (amount / scale /
 * detail sliders) redraw straight, since crossfading every drag step would
 * stutter and stack.
 */
function DeformCanvas({ settings, res }: { settings: Settings; res: number }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const overlayRef = useRef<HTMLCanvasElement>(null);
	const prevKey = useRef<string | null>(null);
	const cleanup = useRef(0);
	const reduced = useReducedMotion();
	const { seed, deform, amount, scale, detail, harmony, mood, hueRange, p3 } =
		settings;
	// The discrete identity, changes here crossfade; slider changes do not.
	const discreteKey = `${seed}|${deform}|${harmony}|${mood}|${hueRange}`;

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const space: PredefinedColorSpace = p3 ? "display-p3" : "srgb";
		const ctx = canvas.getContext("2d", { colorSpace: space });
		if (!ctx) return;

		const changed = prevKey.current !== null && prevKey.current !== discreteKey;
		const overlay = overlayRef.current;
		if (changed && !reduced && overlay) {
			const octx = overlay.getContext("2d", { colorSpace: space });
			if (octx) {
				overlay.width = res;
				overlay.height = res;
				octx.drawImage(canvas, 0, 0);
				overlay.style.transition = "none";
				overlay.style.opacity = "1";
				overlay.style.display = "block";
				requestAnimationFrame(() => {
					overlay.style.transition = `opacity ${XFADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
					overlay.style.opacity = "0";
				});
				window.clearTimeout(cleanup.current);
				cleanup.current = window.setTimeout(() => {
					overlay.style.display = "none";
					overlay.width = 0;
					overlay.height = 0;
				}, XFADE_MS + 80);
			}
		}

		ctx.clearRect(0, 0, res, res);
		drawDeformed(ctx, seed, res, {
			deform,
			amount,
			scale,
			detail,
			paletteX: generatePaletteX(seed, {
				harmony: harmony === "auto" ? undefined : harmony,
				mood,
				hueRange,
			}),
		});
		prevKey.current = discreteKey;
	}, [
		seed,
		deform,
		amount,
		scale,
		detail,
		harmony,
		mood,
		hueRange,
		p3,
		res,
		discreteKey,
		reduced,
	]);

	useEffect(() => () => window.clearTimeout(cleanup.current), []);

	const coverStyle: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		objectFit: "cover",
	};
	return (
		// key on colorSpace: a 2D context can't change space after creation, so a
		// P3 <-> sRGB flip remounts (an instant swap, not a crossfade).
		<div
			key={p3 ? "p3" : "srgb"}
			className="absolute inset-0"
			style={{
				filter: settings.blur > 0 ? `blur(${settings.blur}px)` : undefined,
			}}
		>
			<canvas ref={ref} width={res} height={res} style={coverStyle} />
			<canvas
				ref={overlayRef}
				width={0}
				height={0}
				style={{ ...coverStyle, display: "none", pointerEvents: "none" }}
			/>
		</div>
	);
}

/* ── controls ────────────────────────────────────────────────────────────── */

function Field({
	label,
	value,
	children,
}: {
	label: string;
	value?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-baseline justify-between">
				<span className="text-[12px] font-medium tracking-[0.01em] text-white/[0.5]">
					{label}
				</span>
				{value !== undefined && (
					<span
						style={{ fontFamily: MONO }}
						className="text-[11px] tabular-nums text-white/[0.6]"
					>
						{value}
					</span>
				)}
			</div>
			{children}
		</div>
	);
}

function Slider({
	min,
	max,
	step,
	value,
	onChange,
}: {
	min: number;
	max: number;
	step: number;
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<input
			type="range"
			min={min}
			max={max}
			step={step}
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			className="play-range w-full"
		/>
	);
}

function Segmented<T extends string>({
	options,
	value,
	onChange,
}: {
	options: { id: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
}) {
	// Unique per instance so the sliding highlight never jumps between groups.
	const layoutId = useId();
	const reduced = useReducedMotion();
	return (
		<div className="flex flex-wrap gap-1">
			{options.map((o) => {
				const active = o.id === value;
				return (
					<button
						key={o.id}
						type="button"
						onClick={() => {
							if (!active) {
								tapSound();
								onChange(o.id);
							}
						}}
						className={`relative cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-[550] leading-none transition-colors ${
							active
								? "text-white/[0.96]"
								: "bg-white/[0.05] text-white/[0.55] hover:bg-white/[0.09] hover:text-white/[0.85]"
						}`}
					>
						{/* Shared-layout highlight springs from the old option to the new
						    one (interruptible; balanced params, minimal wobble). */}
						{active && (
							<motion.span
								layoutId={`seg-${layoutId}`}
								aria-hidden="true"
								className="absolute inset-0 rounded-full bg-white/[0.14]"
								transition={
									reduced
										? { duration: 0 }
										: { type: "spring", stiffness: 480, damping: 38 }
								}
							/>
						)}
						<span className="relative z-[1]">{o.label}</span>
					</button>
				);
			})}
		</div>
	);
}

/* ── icons ───────────────────────────────────────────────────────────────── */

const DiceIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		aria-hidden="true"
	>
		<rect
			x="2.5"
			y="2.5"
			width="11"
			height="11"
			rx="2.5"
			stroke="currentColor"
			strokeWidth="1.25"
		/>
		<circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
		<circle cx="10.5" cy="10.5" r="1" fill="currentColor" />
		<circle cx="8" cy="8" r="1" fill="currentColor" />
	</svg>
);

const CopyIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		aria-hidden="true"
	>
		<path
			d="M10.1667 3.16634H12.8334V14.1663H3.16675V3.16634H5.83341M5.83341 1.83301H10.1667V4.83301H5.83341V1.83301Z"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

const DownloadIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		aria-hidden="true"
	>
		<path
			d="M13.5 9.83333V13.5H2.5V9.83333M7.99999 2.5L8 9.33333M5.66667 7.66667L7.99999 10L10.3333 7.66667"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

function PillButton({
	onClick,
	children,
	title,
}: {
	onClick: () => void;
	children: ReactNode;
	title: string;
}) {
	return (
		<button
			type="button"
			title={title}
			onClick={onClick}
			className="flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[13px] font-[550] text-white/[0.9] transition hover:bg-white/[0.12] motion-safe:active:scale-[0.97] cursor-pointer"
		>
			{children}
		</button>
	);
}

/* ── page ────────────────────────────────────────────────────────────────── */

export function PlaygroundContent() {
	const [s, setS] = useState<Settings>(DEFAULTS);
	const [presets, setPresets] = useState<string[]>(() => seededPresets(8));
	const [canCopy, setCanCopy] = useState(false);

	const set = useCallback(
		<K extends keyof Settings>(key: K, value: Settings[K]) =>
			setS((prev) => ({ ...prev, [key]: value })),
		[],
	);

	useEffect(() => {
		setCanCopy(
			typeof navigator !== "undefined" &&
				"clipboard" in navigator &&
				typeof ClipboardItem !== "undefined",
		);
	}, []);

	const exportCanvas = useCallback(() => {
		const { w, h } = FORMAT_DIMS[s.format];
		const colorSpace: PredefinedColorSpace = s.p3 ? "display-p3" : "srgb";

		// Render the gradient as a square, then cover-crop it into the target
		// frame (the same cover the preview shows), so export matches preview.
		const src = document.createElement("canvas");
		src.width = EXPORT_SRC;
		src.height = EXPORT_SRC;
		const sctx = src.getContext("2d", { colorSpace });
		if (!sctx) return null;
		drawDeformed(sctx, s.seed, EXPORT_SRC, optionsFor(s));

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d", { colorSpace });
		if (!ctx) return null;
		const scale = Math.max(w / EXPORT_SRC, h / EXPORT_SRC);
		const dw = EXPORT_SRC * scale;
		const dh = EXPORT_SRC * scale;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);

		// Circle: keep only the inscribed disc, transparent corners.
		if (s.format === "circle") {
			ctx.globalCompositeOperation = "destination-in";
			ctx.beginPath();
			ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalCompositeOperation = "source-over";
		}
		return canvas;
	}, [s]);

	const onCopy = useCallback(() => {
		const canvas = exportCanvas();
		if (!canvas) return;
		canvas.toBlob((blob) => {
			if (!blob) {
				denySound();
				return;
			}
			navigator.clipboard
				.write([new ClipboardItem({ "image/png": blob })])
				.then(() => {
					copySound();
					window.dispatchEvent(new CustomEvent("show-toast"));
				})
				.catch(() => denySound());
		}, "image/png");
	}, [exportCanvas]);

	const onDownload = useCallback(() => {
		const canvas = exportCanvas();
		if (!canvas) return;
		canvas.toBlob((blob) => {
			if (!blob) {
				denySound();
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${s.format}-${s.deform}-${s.seed}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			confirmSound();
		}, "image/png");
	}, [exportCanvas, s.format, s.deform, s.seed]);

	const reroll = useCallback(() => {
		tapSound();
		set("seed", randomSeed());
		setPresets(Array.from({ length: 8 }, randomSeed));
	}, [set]);

	// Measure the preview area so the framed shape can grow to the largest size
	// that fits at the chosen aspect ratio. While the window is actively
	// resizing we disable the frame's morph transition so it tracks 1:1 instead
	// of lagging behind; the morph then only plays on a format change.
	const reduced = useReducedMotion();
	const areaRef = useRef<HTMLDivElement>(null);
	const [area, setArea] = useState({ w: 0, h: 0 });
	const [resizing, setResizing] = useState(false);
	const resizeTimer = useRef(0);
	useEffect(() => {
		const el = areaRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			setArea({ w: el.clientWidth, h: el.clientHeight });
			setResizing(true);
			window.clearTimeout(resizeTimer.current);
			resizeTimer.current = window.setTimeout(() => setResizing(false), 160);
		});
		ro.observe(el);
		return () => {
			ro.disconnect();
			window.clearTimeout(resizeTimer.current);
		};
	}, []);
	const aspect = formatAspect(s.format);
	const frameH = Math.min(area.h, area.w / aspect);
	const frameW = frameH * aspect;
	const frameMorph =
		resizing || reduced
			? "none"
			: "width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 280ms cubic-bezier(0.22, 1, 0.36, 1)";

	return (
		<div className="fixed inset-0 overflow-hidden bg-black">
			<style>{`
.play-range{-webkit-appearance:none;appearance:none;height:4px;border-radius:99px;background:rgba(255,255,255,0.14);outline:none;cursor:pointer}
.play-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.4)}
.play-range::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:#fff;cursor:pointer}
.play-select{appearance:none;background:rgba(255,255,255,0.05);border:0;border-radius:10px;color:rgba(255,255,255,0.9);font-size:13px;padding:8px 12px;width:100%;cursor:pointer}
.play-select:hover{background:rgba(255,255,255,0.09)}
.play-scroll::-webkit-scrollbar{width:8px}
.play-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
`}</style>

			{/* Framed preview: the gradient at the chosen aspect, grown to fill the
			    canvas area left of the panel. The square render is cover-cropped,
			    so it matches the export exactly. */}
			<div
				className={
					s.format === "landscape"
						? "absolute inset-0"
						: "absolute inset-0 p-6 lg:pr-[368px]"
				}
			>
				<div
					ref={areaRef}
					className="relative flex h-full w-full items-center justify-center"
				>
					<div
						className="relative overflow-hidden bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
						style={
							s.format === "landscape"
								? { position: "absolute", inset: 0, borderRadius: 0 }
								: {
										width: frameW || undefined,
										height: frameH || undefined,
										borderRadius:
											s.format === "circle" ? (frameW || 0) / 2 : 24,
										transition: frameMorph,
									}
						}
					>
						<DeformCanvas settings={s} res={FULL_RES} />
					</div>
				</div>
			</div>

			{/* Home mark, top-left. */}
			<Link
				href="/"
				aria-label="Avatars, home"
				className="absolute left-5 top-5 z-20 flex items-center rounded-full bg-black/25 px-3 py-2.5 backdrop-blur-md transition hover:bg-black/40"
			>
				<OutpaceLogo />
			</Link>

			{/* Right editor panel, Figma-style: fits its content, scrolls only if
			    it would exceed the viewport. Eases in on mount (ease-out). */}
			<motion.aside
				initial={reduced ? false : { opacity: 0, x: 16 }}
				animate={{ opacity: 1, x: 0 }}
				transition={
					reduced
						? { duration: 0 }
						: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
				}
				className="absolute right-3 bottom-3 z-20 flex max-h-[calc(100dvh-1.5rem)] w-[340px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#0d0d0f]/85 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
			>
				<div className="play-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
					<Field label="Seed">
						<div className="flex gap-2">
							<input
								type="text"
								value={s.seed}
								onChange={(e) => set("seed", e.target.value)}
								spellCheck={false}
								autoComplete="off"
								placeholder="Type any seed…"
								className="h-10 w-full rounded-[10px] bg-white/[0.05] px-3 text-[13px] text-white/[0.9] placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
							/>
							<button
								type="button"
								title="Random seed"
								onClick={reroll}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-white/[0.7] transition hover:bg-white/[0.12] hover:text-white/[0.95] motion-safe:active:scale-[0.95] cursor-pointer"
							>
								<DiceIcon />
							</button>
						</div>
					</Field>

					<Field label="Format">
						<Segmented
							options={FORMATS}
							value={s.format}
							onChange={(v) => set("format", v)}
						/>
					</Field>

					<Field label="Deformation">
						<Segmented
							options={DEFORMS}
							value={s.deform}
							onChange={(v) => set("deform", v)}
						/>
					</Field>

					<Field label="Amount" value={s.amount.toFixed(2)}>
						<Slider
							min={0}
							max={1}
							step={0.01}
							value={s.amount}
							onChange={(v) => set("amount", v)}
						/>
					</Field>

					<Field label="Scale" value={s.scale.toFixed(1)}>
						<Slider
							min={1}
							max={10}
							step={0.5}
							value={s.scale}
							onChange={(v) => set("scale", v)}
						/>
					</Field>

					<Field label="Detail" value={String(s.detail)}>
						<Slider
							min={1}
							max={6}
							step={1}
							value={s.detail}
							onChange={(v) => set("detail", v)}
						/>
					</Field>

					<Field label="Blur" value={`${s.blur}px`}>
						<Slider
							min={0}
							max={20}
							step={1}
							value={s.blur}
							onChange={(v) => set("blur", v)}
						/>
					</Field>

					<Field label="Mood">
						<Segmented
							options={MOODS_X}
							value={s.mood}
							onChange={(v) => set("mood", v)}
						/>
					</Field>

					<Field label="Hue range">
						<Segmented
							options={HUE_RANGES}
							value={s.hueRange}
							onChange={(v) => set("hueRange", v)}
						/>
					</Field>

					<Field label="Color space">
						<Segmented
							options={[
								{ id: "p3", label: "Display P3" },
								{ id: "srgb", label: "sRGB" },
							]}
							value={s.p3 ? "p3" : "srgb"}
							onChange={(v) => set("p3", v === "p3")}
						/>
					</Field>

					<Field label="Harmony">
						<select
							className="play-select"
							value={s.harmony}
							onChange={(e) =>
								set("harmony", e.target.value as Harmony | "auto")
							}
						>
							{HARMONIES.map((h) => (
								<option key={h.id} value={h.id}>
									{h.label}
								</option>
							))}
						</select>
					</Field>

					<Field label="Presets">
						<div className="grid grid-cols-4 gap-2">
							{presets.map((p) => (
								<button
									key={p}
									type="button"
									title={p}
									onClick={() => {
										tapSound();
										set("seed", p);
									}}
									className="relative aspect-square overflow-hidden rounded-xl bg-white/[0.04] transition hover:opacity-90 motion-safe:active:scale-[0.96] cursor-pointer"
								>
									<DeformCanvas
										settings={{ ...s, seed: p, blur: 0 }}
										res={96}
									/>
								</button>
							))}
						</div>
					</Field>
				</div>

				<div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5">
					{canCopy && (
						<PillButton onClick={onCopy} title="Copy PNG to clipboard">
							<CopyIcon />
							Copy
						</PillButton>
					)}
					<PillButton onClick={onDownload} title="Download PNG">
						<DownloadIcon />
						Download
					</PillButton>
				</div>
			</motion.aside>

			<Toast />
		</div>
	);
}
