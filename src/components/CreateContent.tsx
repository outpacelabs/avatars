"use client";

import {
	confirm as confirmSound,
	copy as copySound,
	deny as denySound,
	tap as tapSound,
} from "@outpacelabs/audio";
import { ShuffleIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/IconButton";
import { CopyMorphIcon } from "@/components/PackageSwitcher";
import { SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";
import type { Harmony } from "@/lib/avatars/mesh-gradient";
import { drawPattern, isCrisp, type Pattern } from "@/lib/avatars/patterns";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";
import { useSmoothCorners } from "@/lib/utils/useSmoothCorners";

/*
 * /create — a visual prop editor in the spirit of ui.shadcn.com/create.
 * A large live preview beside the controls, then copy-ready JSX. Everything
 * runs client-side against the site's engines.
 *
 * Only `seed`, `size`, and `radius` exist in the shipped package today.
 * `pattern` (the dither), `blur`, and `harmony` preview here before they ship
 * to npm — the generated code marks them, and the footnote links to the
 * changelog.
 */

const INK = "rgba(255,255,255,0.92)";
const BODY = "rgba(255,255,255,0.62)";
const MUTED = "rgba(255,255,255,0.42)";
const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

/* Shared entrance tokens — same curve/duration as the home grid and docs. */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const REVEAL_DURATION = 0.28;

const RENDER_SIZE = 256;
const DEFAULT_BLUR_FRACTION = 0.06;
const EXPORT_SIZE = 2000;

const SIZE_MIN = 16;
const SIZE_MAX = 256;

type Shape = "circle" | "rounded" | "square";
type HarmonyChoice = Harmony | "auto";

function harmonyOpts(harmony: HarmonyChoice) {
	return harmony === "auto" ? {} : { harmony };
}

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 10);
}

function sanitizeFilename(seed: string): string {
	return (
		seed
			.trim()
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 48) || "avatar"
	);
}

/* ── export (draw the pattern at 2000px, then bake the blur like the engine) ── */

function renderExportCanvas(
	seed: string,
	pattern: Pattern,
	harmony: HarmonyChoice,
	blurFraction: number,
): HTMLCanvasElement | null {
	const base = document.createElement("canvas");
	base.width = EXPORT_SIZE;
	base.height = EXPORT_SIZE;
	const bctx = base.getContext("2d");
	if (!bctx) return null;
	drawPattern(bctx, seed, EXPORT_SIZE, pattern, harmonyOpts(harmony));
	if (blurFraction <= 0) return base;

	// Composite back with blur, scaled up slightly so the soft edges fall
	// outside the frame (avoids a dark ring) — the engine's formula.
	const out = document.createElement("canvas");
	out.width = EXPORT_SIZE;
	out.height = EXPORT_SIZE;
	const octx = out.getContext("2d");
	if (!octx) return null;
	const blur = Math.round(EXPORT_SIZE * blurFraction);
	const scale = 1 + (blur / EXPORT_SIZE) * 4;
	const dw = EXPORT_SIZE * scale;
	const offset = (dw - EXPORT_SIZE) / 2;
	octx.filter = `blur(${blur}px)`;
	octx.drawImage(base, -offset, -offset, dw, dw);
	octx.filter = "none";
	return out;
}

function exportBlob(
	seed: string,
	pattern: Pattern,
	harmony: HarmonyChoice,
	blurFraction: number,
	type: string,
	quality?: number,
): Promise<Blob | null> {
	const canvas = renderExportCanvas(seed, pattern, harmony, blurFraction);
	if (!canvas) return Promise.resolve(null);
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function downloadAvatar(
	seed: string,
	pattern: Pattern,
	harmony: HarmonyChoice,
	blurFraction: number,
): Promise<boolean> {
	try {
		const blob = await exportBlob(
			seed,
			pattern,
			harmony,
			blurFraction,
			"image/jpeg",
			0.92,
		);
		if (!blob) return false;
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `avatar-${sanitizeFilename(seed)}.jpg`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
		return true;
	} catch {
		return false;
	}
}

async function copyAvatar(
	seed: string,
	pattern: Pattern,
	harmony: HarmonyChoice,
	blurFraction: number,
): Promise<boolean> {
	try {
		const item = new ClipboardItem({
			"image/png": exportBlob(
				seed,
				pattern,
				harmony,
				blurFraction,
				"image/png",
			) as Promise<Blob>,
		});
		await navigator.clipboard.write([item]);
		return true;
	} catch {
		return false;
	}
}

function clipboardSupported(): boolean {
	return (
		typeof navigator !== "undefined" &&
		"clipboard" in navigator &&
		typeof ClipboardItem !== "undefined" &&
		"write" in navigator.clipboard &&
		!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	);
}

/* ── icons shared with the home grid (same 16px / 1.25 stroke language) ── */

const DownloadIcon = () => (
	<svg
		aria-hidden="true"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M13.5 9.83333V13.5H2.5V9.83333M7.99999 2.5L8 9.33333M5.66667 7.66667L7.99999 10L10.3333 7.66667"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

const ClipboardIcon = () => (
	<svg
		aria-hidden="true"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M10.1667 3.16634H12.8334V14.1663H3.16675V3.16634H5.83341M5.83341 1.83301H10.1667V4.83301H5.83341V1.83301Z"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

/* ── canvas that paints either pattern (the editor's live surface) ── */

function PatternCanvas({
	seed,
	pattern,
	harmony,
	size,
	radius,
	blurPx,
}: {
	seed: string;
	pattern: Pattern;
	harmony: HarmonyChoice;
	size: number;
	radius: number | string;
	blurPx: number;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
		drawPattern(ctx, seed, RENDER_SIZE, pattern, harmonyOpts(harmony));
	}, [seed, pattern, harmony]);

	return (
		<span
			style={{
				display: "inline-block",
				overflow: "hidden",
				borderRadius: radius,
				width: size,
				height: size,
			}}
		>
			<canvas
				ref={canvasRef}
				width={RENDER_SIZE}
				height={RENDER_SIZE}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
				}}
			/>
		</span>
	);
}

/* ── controls ── */

function ControlLabel({
	children,
	value,
	experimental,
}: {
	children: ReactNode;
	value?: ReactNode;
	experimental?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="flex items-center gap-2">
				<span
					style={{ fontSize: 13, fontWeight: 450, color: INK }}
					className="leading-5"
				>
					{children}
				</span>
				{experimental && (
					<span
						style={{
							fontFamily: MONO,
							fontSize: 10,
							letterSpacing: "0.06em",
							textTransform: "uppercase",
							color: MUTED,
							background: "rgba(255,255,255,0.06)",
							borderRadius: 99,
							padding: "1px 8px",
						}}
					>
						Experimental
					</span>
				)}
			</span>
			{value !== undefined && (
				<span
					style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}
					className="leading-5 tabular-nums whitespace-nowrap"
				>
					{value}
				</span>
			)}
		</div>
	);
}

function Slider({
	value,
	min,
	max,
	onChange,
	label,
}: {
	value: number;
	min: number;
	max: number;
	onChange: (v: number) => void;
	label: string;
}) {
	const pct = ((value - min) / (max - min)) * 100;
	return (
		<input
			type="range"
			className="create-range"
			aria-label={label}
			min={min}
			max={max}
			step={1}
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			style={{
				background: `linear-gradient(to right, rgba(255,255,255,0.72) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
			}}
		/>
	);
}

function Segmented<T extends string>({
	options,
	value,
	onChange,
	label,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
	label: string;
}) {
	return (
		// fieldset (not role="group") for semantics; min-w-0 undoes the
		// browser's min-inline-size: min-content so it can shrink in the column.
		<fieldset
			aria-label={label}
			className="flex min-w-0 rounded-full bg-white/[0.06] p-1"
		>
			{options.map((opt) => {
				const active = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						aria-pressed={active}
						onClick={() => {
							if (!active) {
								tapSound();
								onChange(opt.value);
							}
						}}
						className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-[550] leading-5 transition-colors ${
							active
								? "bg-white/[0.14] text-white/[0.92]"
								: "text-white/[0.48] hover:text-white/[0.8]"
						}`}
					>
						{opt.label}
					</button>
				);
			})}
		</fieldset>
	);
}

/* ── generated code (hand-tokenized — colors match the docs' github-dark) ── */

const TOK = {
	keyword: "#FF7B72",
	tag: "#7EE787",
	attr: "#79C0FF",
	string: "#A5D6FF",
	plain: "#E6EDF3",
};

interface CodeAttr {
	name: string;
	/** Rendered verbatim, e.g. `"studio"` or `{96}`. */
	value: string;
	string: boolean;
	experimental?: boolean;
}

function buildAttrs(
	seed: string,
	pattern: Pattern,
	size: number,
	shape: Shape,
	radius: number,
	blurOverride: number | null,
	harmony: HarmonyChoice,
): CodeAttr[] {
	const attrs: CodeAttr[] = [
		{ name: "seed", value: JSON.stringify(seed), string: true },
		{ name: "size", value: `{${size}}`, string: false },
	];
	if (pattern !== "mesh") {
		attrs.push({
			name: "pattern",
			value: `"${pattern}"`,
			string: true,
			experimental: true,
		});
	}
	if (shape === "square") {
		attrs.push({ name: "radius", value: "{0}", string: false });
	} else if (shape === "rounded") {
		attrs.push({ name: "radius", value: `{${radius}}`, string: false });
	}
	if (blurOverride !== null) {
		attrs.push({
			name: "blur",
			value: `{${blurOverride}}`,
			string: false,
			experimental: true,
		});
	}
	if (harmony !== "auto") {
		attrs.push({
			name: "harmony",
			value: `"${harmony}"`,
			string: true,
			experimental: true,
		});
	}
	return attrs;
}

function codeText(attrs: CodeAttr[]): string {
	const importLine = `import { GradientAvatar } from "@outpacelabs/avatars";`;
	if (attrs.length <= 2) {
		const inline = attrs.map((a) => `${a.name}=${a.value}`).join(" ");
		return `${importLine}\n\n<GradientAvatar ${inline} />`;
	}
	const lines = attrs.map((a) => `  ${a.name}=${a.value}`).join("\n");
	return `${importLine}\n\n<GradientAvatar\n${lines}\n/>`;
}

function CodeBlock({ attrs }: { attrs: CodeAttr[] }) {
	const multiline = attrs.length > 2;
	return (
		<pre
			style={{
				margin: 0,
				padding: "16px 18px",
				overflowX: "auto",
				lineHeight: 1.65,
				fontFamily: MONO,
				fontSize: 13,
				color: TOK.plain,
			}}
		>
			<span style={{ color: TOK.keyword }}>import</span>
			{" { GradientAvatar } "}
			<span style={{ color: TOK.keyword }}>from</span>{" "}
			<span style={{ color: TOK.string }}>
				&quot;@outpacelabs/avatars&quot;
			</span>
			;{"\n\n"}
			{"<"}
			<span style={{ color: TOK.tag }}>GradientAvatar</span>
			{attrs.map((a) => (
				<span key={a.name}>
					{multiline ? "\n  " : " "}
					<span style={{ color: TOK.attr }}>{a.name}</span>=
					<span style={{ color: a.string ? TOK.string : TOK.plain }}>
						{a.value}
					</span>
				</span>
			))}
			{multiline ? "\n/>" : " />"}
		</pre>
	);
}

/* ── the page ── */

export function CreateContent() {
	const [seed, setSeed] = useState("studio");
	const [pattern, setPattern] = useState<Pattern>("mesh");
	const [size, setSize] = useState(96);
	const [shape, setShape] = useState<Shape>("circle");
	const [radius, setRadius] = useState(24);
	// Blur and harmony controls are hidden for now — pinned to their defaults so
	// the plumbing (and re-enabling them) stays a one-line change.
	const blurOverride: number | null = null;
	const harmony: HarmonyChoice = "auto";
	const [canCopy, setCanCopy] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);

	const reducedMotion = usePrefersReducedMotion();
	const previewRef = useSmoothCorners<HTMLDivElement>(20);
	const controlsRef = useSmoothCorners<HTMLDivElement>(20);
	const codeRef = useSmoothCorners<HTMLDivElement>(16);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCanCopy(clipboardSupported());
	}, []);

	// Rounded-corner radius can never exceed half the avatar.
	const maxRadius = Math.floor(size / 2);
	const clampedRadius = Math.min(radius, maxRadius);
	// The dither reads best crisp, so it defaults to no blur; the mesh keeps the
	// signature ~6%. The slider always overrides.
	const autoBlur = isCrisp(pattern)
		? 0
		: Math.max(1, Math.round(size * DEFAULT_BLUR_FRACTION));
	const blurPx = blurOverride ?? autoBlur;
	const blurFraction = size > 0 ? blurPx / size : 0;

	const previewRadius: number | string =
		shape === "circle" ? "9999px" : shape === "square" ? 0 : clampedRadius;

	const attrs = buildAttrs(
		seed,
		pattern,
		size,
		shape,
		clampedRadius,
		blurOverride,
		harmony,
	);
	const hasExperimental = attrs.some((a) => a.experimental);

	const toast = () => window.dispatchEvent(new CustomEvent("show-toast"));

	const copyCode = () => {
		void navigator.clipboard
			?.writeText(codeText(attrs))
			.then(() => {
				copySound();
				setCopiedCode(true);
				window.setTimeout(() => setCopiedCode(false), 1400);
				posthog.capture("Create Code Copied", {
					seed,
					pattern,
					size,
					shape,
					blur: blurOverride,
					harmony,
				});
			})
			.catch(() => denySound());
	};

	const reveal = (delay: number) => ({
		initial: reducedMotion ? false : { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: REVEAL_DURATION, delay, ease: EASE_OUT },
	});

	return (
		<div className="relative flex flex-col items-center min-h-screen pb-24 overflow-x-clip">
			{/* Range-input skin: minimal white-on-dark, matching the frosted pills. */}
			<style>{`
.create-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;outline:none;cursor:pointer}
.create-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:99px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:grab}
.create-range::-webkit-slider-thumb:active{cursor:grabbing}
.create-range::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:99px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:grab}
.create-range:focus-visible{outline:2px solid rgba(255,255,255,0.4);outline-offset:4px}`}</style>

			<div className="flex flex-col items-center w-full pt-3 gap-6">
				{/* Full-bleed within the section's px-6 — no reading-column cap, so
				    the editor uses the whole container width. */}
				<section className="w-full px-6 flex flex-col gap-3">
					<SiteHeader />

					<div className="pt-14 sm:pt-20 w-full">
						<motion.div {...reveal(0)}>
							{/* Headline hidden by design, kept for SEO/accessibility. */}
							<h1 className="sr-only">Create</h1>
							<p
								style={{
									fontSize: 14,
									lineHeight: 1.72,
									letterSpacing: "0.1px",
									color: BODY,
									margin: 0,
									maxWidth: 640,
									textWrap: "pretty",
								}}
							>
								Tune the props, watch the avatar update live, and copy the code.
								The dither pattern is an experimental preview of what could ship
								next.
							</p>
						</motion.div>

						<div className="mt-6 grid gap-3 lg:grid-cols-[1fr_360px] items-start">
							{/* ── preview ── */}
							<motion.div
								{...reveal(0.06)}
								ref={previewRef}
								className="relative flex flex-col rounded-[20px] bg-white/[0.04] p-5 md:p-6 min-h-[420px] lg:min-h-[520px]"
							>
								<div className="flex items-start justify-between">
									<span
										style={{
											fontFamily: MONO,
											fontSize: 10,
											letterSpacing: "0.04em",
											color: MUTED,
										}}
										className="leading-4"
									>
										{pattern.toUpperCase()}
									</span>
									<span
										style={{
											fontFamily: MONO,
											fontSize: 10,
											letterSpacing: "0.04em",
											color: MUTED,
										}}
										className="leading-4 max-w-[50%] whitespace-nowrap overflow-hidden text-ellipsis"
									>
										{seed}
									</span>
								</div>

								<div className="flex-1 grid place-items-center py-8">
									<PatternCanvas
										seed={seed}
										pattern={pattern}
										harmony={harmony}
										size={size}
										radius={previewRadius}
										blurPx={blurPx}
									/>
								</div>

								<div className="flex items-center justify-end gap-3">
									<div className="flex items-center gap-1">
										{canCopy && (
											<IconButton
												onClick={() => {
													void copyAvatar(
														seed,
														pattern,
														harmony,
														blurFraction,
													).then((ok) => {
														if (ok) {
															copySound();
															toast();
														} else {
															denySound();
														}
													});
												}}
												title="Copy to clipboard"
											>
												<ClipboardIcon />
											</IconButton>
										)}
										<IconButton
											onClick={() => {
												void downloadAvatar(
													seed,
													pattern,
													harmony,
													blurFraction,
												).then((ok) => (ok ? confirmSound() : denySound()));
											}}
											title="Download 2000×2000"
										>
											<DownloadIcon />
										</IconButton>
									</div>
								</div>
							</motion.div>

							{/* ── controls ── */}
							<motion.div
								{...reveal(0.12)}
								ref={controlsRef}
								className="rounded-[20px] bg-white/[0.04]"
							>
								{/* Seed */}
								<div className="flex flex-col gap-3 p-5">
									<ControlLabel>Seed</ControlLabel>
									<div className="flex items-center gap-2">
										<input
											type="text"
											value={seed}
											onChange={(e) => setSeed(e.target.value)}
											spellCheck={false}
											autoComplete="off"
											placeholder="Type any seed..."
											aria-label="Seed"
											style={{ fontFamily: MONO }}
											className="min-w-0 flex-1 rounded-[10px] bg-white/[0.06] px-3 py-2 text-[13px] leading-5 text-white/[0.88] placeholder:text-white/30 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
										/>
										<IconButton
											onClick={() => {
												tapSound();
												setSeed(randomSeed());
											}}
											title="Random seed"
										>
											<ShuffleIcon width={15} height={15} aria-hidden="true" />
										</IconButton>
									</div>
								</div>

								{/* Pattern (experimental — dither previews the npm prop) */}
								<div className="flex flex-col gap-3 p-5 border-t border-white/[0.06]">
									<ControlLabel experimental>Pattern</ControlLabel>
									<Segmented
										options={[
											{ value: "mesh", label: "Mesh" },
											{ value: "dither", label: "Dither" },
										]}
										value={pattern}
										onChange={setPattern}
										label="Render pattern"
									/>
								</div>

								{/* Size */}
								<div className="flex flex-col gap-3 p-5 border-t border-white/[0.06]">
									<ControlLabel value={`${size}px`}>Size</ControlLabel>
									<Slider
										value={size}
										min={SIZE_MIN}
										max={SIZE_MAX}
										onChange={setSize}
										label="Size in pixels"
									/>
								</div>

								{/* Shape / radius */}
								<div className="flex flex-col gap-3 p-5 border-t border-white/[0.06]">
									<ControlLabel
										value={
											shape === "rounded" ? `${clampedRadius}px` : undefined
										}
									>
										Shape
									</ControlLabel>
									<Segmented
										options={[
											{ value: "circle", label: "Circle" },
											{ value: "rounded", label: "Rounded" },
											{ value: "square", label: "Square" },
										]}
										value={shape}
										onChange={setShape}
										label="Corner shape"
									/>
									{shape === "rounded" && (
										<Slider
											value={clampedRadius}
											min={0}
											max={maxRadius}
											onChange={setRadius}
											label="Corner radius in pixels"
										/>
									)}
								</div>
							</motion.div>
						</div>

						{/* ── generated code ── */}
						<motion.div {...reveal(0.18)} className="mt-3">
							<div
								ref={codeRef}
								className="relative rounded-[16px] bg-white/[0.04] overflow-hidden"
							>
								<button
									type="button"
									title="Copy code"
									aria-label="Copy code"
									onClick={copyCode}
									className="absolute top-2.5 right-2.5 z-[1] grid size-8 cursor-pointer place-items-center rounded-full text-white/[0.4] transition hover:bg-white/[0.08] hover:text-white/[0.88] motion-safe:active:scale-95"
								>
									<CopyMorphIcon copied={copiedCode} />
								</button>
								<CodeBlock attrs={attrs} />
							</div>
							{hasExperimental && (
								<p
									style={{
										fontSize: 12,
										lineHeight: 1.6,
										letterSpacing: "0.1px",
										color: MUTED,
										margin: "10px 4px 0",
									}}
								>
									the dither pattern is a preview — only seed, size, and radius
									are in the npm package today. Follow along on the{" "}
									<a
										href="/changelog"
										style={{
											color: INK,
											textDecoration: "underline",
											textUnderlineOffset: "2px",
										}}
									>
										changelog
									</a>
									.
								</p>
							)}
						</motion.div>
					</div>
				</section>
			</div>

			<Toast />
		</div>
	);
}
