"use client";

import {
	confirm as confirmSound,
	copy as copySound,
	deny as denySound,
} from "@outpacelabs/audio";
import { motion } from "framer-motion";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { GradientAvatar } from "@/components/GradientAvatar";
import { IconButton } from "@/components/IconButton";
import { CopyMorphIcon } from "@/components/PackageSwitcher";
import { PatternSwitch } from "@/components/PatternSwitch";
import { SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";
import { drawPattern, type Pattern } from "@/lib/avatars/patterns";
import { FAQ } from "@/lib/seo";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";
import { useSmoothCorners } from "@/lib/utils/useSmoothCorners";

/**
 * Visually hidden, but present in the initial HTML for crawlers, LLMs, and
 * screen readers, since the home page is otherwise a keyword-free <canvas>
 * grid. The page's H1 is the visible hero headline; this section carries the
 * supporting copy (h2s only). Rendered after the hero so heading order stays
 * sequential. The FAQ text mirrors the FAQPage JSON-LD in layout.tsx (must
 * stay in sync).
 */
function SeoContent() {
	return (
		<section className="sr-only">
			<p>
				<strong>@outpacelabs/avatars</strong> is a free, open-source React
				component that renders generative, deterministic mesh-gradient avatars
				on an HTML canvas. The same seed, whether a user id, email, or username,
				always produces the same gradient, so you get a stable profile picture
				with no stored images and no network requests. A pattern prop renders
				each seed as the signature soft mesh gradient or a crisp ordered dither.
				Zero dependencies, MIT licensed.
			</p>
			<p>
				Install with <code>npm i @outpacelabs/avatars</code>, then render a{" "}
				<code>GradientAvatar</code> with any <code>seed</code>.
			</p>
			<nav aria-label="Primary">
				<a href="/docs">Read the documentation</a>
				<a href="https://github.com/outpacelabs/avatars">
					View source on GitHub
				</a>
				<a href="https://www.npmjs.com/package/@outpacelabs/avatars">
					View the package on npm
				</a>
			</nav>

			<h2>What is @outpacelabs/avatars?</h2>
			<p>
				A zero-dependency React avatar component for generative, colorful
				gradient profile pictures. Drop in any seed string or number and get a
				unique, reproducible mesh gradient, ideal for user avatars, placeholder
				and fallback images, team logos, and brand artwork. Render to a canvas,
				a PNG data URL, a Blob, or export at 2000×2000.
			</p>

			<h2>Same seed, same avatar, every time</h2>
			<p>
				Gradients are derived deterministically from the seed, so the same input
				renders identically across devices and reloads. A user id or email
				becomes a stable avatar you never have to store or migrate.
			</p>

			<h2>Zero dependencies, no network</h2>
			<p>
				Everything renders client-side on an HTML canvas. There are no API
				calls, no stored images, and nothing leaves the user&apos;s device,
				which is great for privacy, offline use, and avoiding third-party
				requests.
			</p>

			<h2>A canvas alternative to Boring Avatars and DiceBear</h2>
			<p>
				Most avatar libraries render SVG and many depend on an API.
				@outpacelabs/avatars renders gradient/mesh fills on canvas with zero
				dependencies and no network calls, a maintained, privacy-first
				alternative when you want gradient avatars instead of shapes or
				illustrations.
			</p>

			<h2>Frequently asked questions</h2>
			{FAQ.map(({ q, a }) => (
				<Fragment key={q}>
					<h3>{q}</h3>
					<p>{a}</p>
				</Fragment>
			))}
		</section>
	);
}

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

/**
 * Copyable `npm i @outpacelabs/avatars` command, the hero's primary CTA.
 * Feedback is the morph alone, no toast: this is a single, prominent button
 * whose icon is exactly what you're looking at when you click, unlike the
 * anonymous small copy buttons scattered across the grid below (those use a
 * toast instead, since there's no single icon worth watching there).
 */
function NpmInstall() {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			title="Copy install command"
			onClick={() => {
				void navigator.clipboard
					?.writeText("npm i @outpacelabs/avatars")
					.then(() => {
						copySound();
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1400);
					})
					.catch(() => denySound());
			}}
			className="group/npm flex h-12 items-center gap-3 rounded-full bg-white/[0.08] pl-5 pr-2 transition hover:bg-white/[0.12] motion-safe:active:scale-[0.98] cursor-pointer"
		>
			<span className="font-mono text-[13px] leading-5 text-white/[0.4] select-none">
				$
			</span>
			<span className="font-mono text-[13px] leading-5 text-white/[0.88]">
				npm i @outpacelabs/avatars
			</span>
			<span className="grid size-8 shrink-0 place-items-center rounded-full text-white/[0.4] transition-colors group-hover/npm:text-white/[0.88]">
				<CopyMorphIcon copied={copied} />
			</span>
		</button>
	);
}

const POOL_SIZE = 30;
const EXPORT_SIZE = 2000;

/* ── onload orchestration ──
 * One set of entrance tokens (timing-consistent): every reveal shares the
 * same duration and ease-out curve; sequence comes from delays only.
 * Timeline: hero H1 at 0, install pill at +60ms, then the grid wave from
 * +120ms (staging-one-focal-point, the headline reads first, the wall
 * follows). Individual animations stay under 300ms; card stagger is 25ms
 * per item, capped (physics-no-excessive-stagger). */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const REVEAL_DURATION = 0.28;
/** Delay before the grid wave starts on first load (hero settles first). */
const GRID_DELAY = 0.12;
/** Hero children reveal 60ms apart (H1, then the install pill). */
const HERO_STAGGER = 0.06;

const heroChild = {
	hidden: { opacity: 0, y: 12 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: REVEAL_DURATION, ease: EASE_OUT },
	},
};

const GLYPHS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@/._-";

/**
 * The headline's pattern word ("gradient" ↔ "dither"), "decoded" into place
 * when the pattern switch flips: each glyph cycles through random characters
 * then locks to its target, staggered left-to-right, the same technique as
 * ScrambleCommand (PackageSwitcher) and ScrambleText (OrbitDemo). The resting
 * state is the plain word (correct in the server HTML, no scramble on first
 * mount); reduced motion swaps instantly.
 */
function ScrambleWord({ word }: { word: string }) {
	const reduced = usePrefersReducedMotion();
	// While animating, `scramble` holds the in-flight glyphs; otherwise null and
	// we render `word` directly (correct on the server, no first-mount jump).
	const [scramble, setScramble] = useState<string | null>(null);
	const mounted = useRef(false);

	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			return;
		}
		if (reduced) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setScramble(null);
			return;
		}
		const chars = [...word];
		const PER = 6; // ms of stagger per character
		const DUR = 130; // ms each character spends scrambling
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const elapsed = now - start;
			let settled = true;
			const frame = chars.map((ch, i) => {
				if (elapsed >= i * PER + DUR) return ch;
				settled = false;
				return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
			});
			setScramble(settled ? null : frame.join(""));
			if (!settled) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [word, reduced]);

	return <>{scramble ?? word}</>;
}

const DEFAULT_HERO_SEED = "";

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 10);
}

function randomPool(): string[] {
	return Array.from({ length: POOL_SIZE }, randomSeed);
}

/**
 * Deterministic first batch so the grid renders server-side at full height,
 * no post-hydration layout shift or flash. Subsequent batches are random.
 * An LCG keeps the seeds varied-looking while staying identical on server
 * and client (avoids hydration mismatch that Math.random() would cause).
 */
function initialPool(): string[] {
	let s = 0x9e3779b9;
	return Array.from({ length: POOL_SIZE }, () => {
		s = (Math.imul(s ^ (s >>> 15), s | 1) >>> 0) >>> 0;
		return (s >>> 0).toString(36).padStart(7, "0").slice(0, 7);
	});
}

function sanitizeFilename(seed: string): string {
	return (
		seed
			.trim()
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 48) || "gradient"
	);
}

/**
 * The mesh export renders small, blurs there, and upscales: the ~6% blur is
 * scale-invariant, so blurring 512px and stretching to 2000px is visually
 * identical to blurring 2000px directly, at ~1/15th of the (main-thread)
 * cost. That cost was the "slow copy", felt most right after a pattern
 * switch when the thread is already busy crossfading the grid.
 */
const MESH_EXPORT_RENDER = 512;

/**
 * Render a seed's avatar at 2000×2000 (matching the original baked assets).
 * The mesh bakes in the same ~6% blur the live avatars use, scaled up slightly
 * so the blur's transparent edges fall outside the frame (avoids a dark ring);
 * the dither is crisp and drawn at full size (its cells must stay sharp).
 * Fully client-side, nothing is stored server-side.
 */
function renderGradientCanvas(
	seed: string,
	pattern: Pattern,
): HTMLCanvasElement | null {
	if (pattern === "dither") {
		const out = document.createElement("canvas");
		out.width = EXPORT_SIZE;
		out.height = EXPORT_SIZE;
		const ctx = out.getContext("2d");
		if (!ctx) return null;
		drawPattern(ctx, seed, EXPORT_SIZE, "dither");
		return out;
	}

	const base = document.createElement("canvas");
	base.width = MESH_EXPORT_RENDER;
	base.height = MESH_EXPORT_RENDER;
	const bctx = base.getContext("2d");
	if (!bctx) return null;
	drawPattern(bctx, seed, MESH_EXPORT_RENDER, "mesh");

	const mid = document.createElement("canvas");
	mid.width = MESH_EXPORT_RENDER;
	mid.height = MESH_EXPORT_RENDER;
	const mctx = mid.getContext("2d");
	if (!mctx) return null;
	const blur = Math.round(MESH_EXPORT_RENDER * 0.06);
	const scale = 1.18;
	const dw = MESH_EXPORT_RENDER * scale;
	const offset = (dw - MESH_EXPORT_RENDER) / 2;
	mctx.filter = `blur(${blur}px)`;
	mctx.drawImage(base, -offset, -offset, dw, dw);
	mctx.filter = "none";

	const out = document.createElement("canvas");
	out.width = EXPORT_SIZE;
	out.height = EXPORT_SIZE;
	const octx = out.getContext("2d");
	if (!octx) return null;
	octx.imageSmoothingEnabled = true;
	octx.imageSmoothingQuality = "high";
	octx.drawImage(mid, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
	return out;
}

/**
 * Encoded exports keyed by pattern/format/seed, so repeat copies and
 * downloads of the same avatar are instant. Tiny FIFO, blobs are ~1–3MB.
 */
const blobCache = new Map<string, Promise<Blob | null>>();
const BLOB_CACHE_MAX = 8;

function gradientBlob(
	seed: string,
	pattern: Pattern,
	type: string,
	quality?: number,
): Promise<Blob | null> {
	const key = `${pattern}|${type}|${quality ?? ""}|${seed}`;
	const hit = blobCache.get(key);
	if (hit) return hit;

	const canvas = renderGradientCanvas(seed, pattern);
	if (!canvas) return Promise.resolve(null);
	const promise = new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, type, quality),
	).then((blob) => {
		// Don't pin a failed encode in the cache.
		if (!blob) blobCache.delete(key);
		return blob;
	});

	blobCache.set(key, promise);
	if (blobCache.size > BLOB_CACHE_MAX) {
		const oldest = blobCache.keys().next().value;
		if (oldest !== undefined) blobCache.delete(oldest);
	}
	return promise;
}

/** Download the avatar as a JPEG. Resolves false if rendering failed. */
async function downloadGradient(
	seed: string,
	pattern: Pattern,
): Promise<boolean> {
	try {
		const blob = await gradientBlob(seed, pattern, "image/jpeg", 0.92);
		if (!blob) return false;
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${pattern === "dither" ? "dither" : "gradient"}-${sanitizeFilename(seed)}.jpg`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
		return true;
	} catch {
		return false;
	}
}

/** Copy the avatar as a PNG to the clipboard. Returns false if unsupported. */
async function copyGradient(seed: string, pattern: Pattern): Promise<boolean> {
	try {
		const item = new ClipboardItem({
			"image/png": gradientBlob(seed, pattern, "image/png") as Promise<Blob>,
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

function GradientCard({
	seed,
	index,
	canCopy,
	pattern,
}: {
	seed: string;
	index: number;
	canCopy: boolean;
	pattern: Pattern;
}) {
	const reducedMotion = usePrefersReducedMotion();
	const smoothRef = useSmoothCorners<HTMLDivElement>(20);

	const copy = () => {
		void copyGradient(seed, pattern).then((ok) => {
			if (ok) {
				copySound();
				window.dispatchEvent(new CustomEvent("show-toast"));
			} else {
				denySound();
			}
		});
	};

	return (
		<motion.div
			ref={smoothRef}
			initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: REVEAL_DURATION,
				// First batch waits for the hero copy to settle (staging: one
				// focal point at a time); scroll-loaded batches reveal instantly.
				// Cap the stagger window so a 30-card batch reveals as one wave,
				// not a ~0.7s cascade (physics-no-excessive-stagger).
				delay:
					(index < POOL_SIZE ? GRID_DELAY : 0) +
					Math.min(index % POOL_SIZE, 8) * 0.025,
				ease: EASE_OUT,
			}}
			className="group relative aspect-square rounded-[20px] bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
		>
			{/* Click target: copy this gradient to the clipboard */}
			<button
				type="button"
				aria-label={`Copy gradient for seed ${seed}`}
				onClick={copy}
				disabled={!canCopy}
				className="absolute inset-0 flex items-center justify-center rounded-[20px] enabled:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
			>
				<div className="size-[80px] md:size-[96px] transition-transform duration-150 motion-safe:group-hover:scale-105">
					{/* fill: the responsive wrapper owns the dimensions; a fixed
					    96px avatar overflowed the 80px mobile box 8px off-center. */}
					<GradientAvatar seed={seed} size={96} fill pattern={pattern} />
				</div>
			</button>

			<span className="absolute top-4 left-4 md:top-5 md:left-5 text-[10px] font-medium text-white/[0.4] leading-4 tracking-[0.04em] tabular-nums pointer-events-none">
				{(index + 1).toString().padStart(3, "0")}
			</span>

			<span className="absolute top-4 right-4 md:top-5 md:right-5 max-w-[50%] text-[10px] font-mono text-white/[0.4] leading-4 tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none">
				{seed}
			</span>

			<div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4 flex items-center justify-end gap-1 opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
				{canCopy && (
					<IconButton
						onClick={(e) => {
							e.stopPropagation();
							copy();
						}}
						title="Copy to clipboard"
					>
						<ClipboardIcon />
					</IconButton>
				)}
				<IconButton
					onClick={() => {
						void downloadGradient(seed, pattern).then((ok) =>
							ok ? confirmSound() : denySound(),
						);
					}}
					title="Download 2000×2000"
				>
					<DownloadIcon />
				</IconButton>
			</div>
		</motion.div>
	);
}

export default function Home() {
	const [heroSeed, setHeroSeed] = useState(DEFAULT_HERO_SEED);
	const [pattern, setPattern] = useState<Pattern>("mesh");
	const [pool, setPool] = useState<string[]>(initialPool);
	const [showTopBlur, setShowTopBlur] = useState(false);
	const [canCopy, setCanCopy] = useState(false);
	// A toast and the pattern switch share the bottom-center slot: while a toast
	// shows, the switch slides out, then returns once the toast clears.
	const [toastActive, setToastActive] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const reducedMotion = usePrefersReducedMotion();
	const heroCardRef = useSmoothCorners<HTMLLabelElement>(20);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCanCopy(clipboardSupported());
	}, []);

	// Infinite scroll: append a fresh batch of 30 whenever the sentinel near the
	// footer scrolls into view.
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setPool((prev) => [...prev, ...randomPool()]);
				}
			},
			{ rootMargin: "200px 0px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const handleScroll = () => setShowTopBlur(window.scrollY > 50);
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const copyHero = useCallback(() => {
		void copyGradient(heroSeed, pattern).then((ok) => {
			if (ok) {
				copySound();
				window.dispatchEvent(new CustomEvent("show-toast"));
			} else {
				denySound();
			}
		});
	}, [heroSeed, pattern]);

	const exportHero = useCallback(() => {
		void downloadGradient(heroSeed, pattern).then((ok) =>
			ok ? confirmSound() : denySound(),
		);
	}, [heroSeed, pattern]);

	return (
		<div className="relative flex flex-col items-center min-h-screen pb-24 overflow-x-clip">
			{/* Top scroll fade */}
			<div
				className={`fixed top-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
					showTopBlur ? "opacity-100" : "opacity-0"
				}`}
				style={{
					// #0a0a0a = the body background (#000 lifted 4% white in
					// globals.css), pure #000 here reads as a darker band.
					background:
						"linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)",
				}}
			/>

			<div className="flex flex-col items-center w-full pt-3 gap-6">
				{/* WALL, the hero lives as a 2×2 feature in the top-left */}
				<section className="w-full px-6 flex flex-col gap-3">
					<SiteHeader />

					{/* HERO, slides up + fades on mount, the same reveal the docs' first
					    section uses (same curve/duration), so arriving at either page
					    animates its top content identically. Safe to transform: the
					    sticky header is a preceding sibling, not an ancestor. */}
					<motion.div
						className="flex flex-col items-center text-center gap-7 pt-14 pb-12 sm:pt-20 sm:pb-16"
						initial={reducedMotion ? false : "hidden"}
						animate="show"
						variants={{
							show: { transition: { staggerChildren: HERO_STAGGER } },
						}}
					>
						{/* Docs-H1 type at hero scale: weight 550, tight tracking, ink.
						    Resting text is exactly TAGLINE (server HTML stays intact);
						    the pattern word decodes in place when the switch flips. */}
						<motion.h1
							variants={heroChild}
							className="text-3xl font-[550] leading-[1.2] tracking-[-0.4px] text-white/[0.92] text-balance"
						>
							Beautiful generative
							<br />
							<ScrambleWord
								word={pattern === "dither" ? "dither" : "gradient"}
							/>{" "}
							avatars
						</motion.h1>
						<motion.div variants={heroChild}>
							<NpmInstall />
						</motion.div>
					</motion.div>
					<SeoContent />

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
						{/* HERO (2 cols × 2 rows), the whole card focuses the seed input.
						    It leads the grid wave (same entrance as the cards, first slot)
						    instead of popping in statically around the animating cards. */}
						<motion.label
							ref={heroCardRef}
							initial={
								reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }
							}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{
								duration: REVEAL_DURATION,
								delay: GRID_DELAY,
								ease: EASE_OUT,
							}}
							className="col-span-2 row-span-2 aspect-square sm:aspect-auto relative flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white/[0.04] p-4 sm:p-6 cursor-text"
						>
							<motion.div
								className="will-change-transform"
								animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
								transition={
									reducedMotion
										? undefined
										: { duration: 8, repeat: Infinity, ease: "easeInOut" }
								}
							>
								<GradientAvatar seed={heroSeed} size={160} pattern={pattern} />
							</motion.div>

							<div className="flex flex-col items-center gap-4 w-full max-w-[260px]">
								<input
									type="text"
									value={heroSeed}
									onChange={(e) => setHeroSeed(e.target.value)}
									spellCheck={false}
									autoComplete="off"
									className="w-full bg-transparent border-0 pb-2 text-center text-white text-sm font-medium tracking-[0.14px] placeholder:text-white/30 focus:placeholder:text-transparent focus:outline-none"
									placeholder="Type any seed..."
								/>
								<div className="flex items-center gap-1">
									{canCopy && (
										<IconButton onClick={copyHero} title="Copy to clipboard">
											<ClipboardIcon />
										</IconButton>
									)}
									<IconButton onClick={exportHero} title="Download 2000×2000">
										<DownloadIcon />
									</IconButton>
								</div>
							</div>
						</motion.label>

						{pool.map((seed, index) => (
							<GradientCard
								key={`${index}-${seed}`}
								seed={seed}
								index={index}
								canCopy={canCopy}
								pattern={pattern}
							/>
						))}
					</div>

					{/* Infinite-scroll trigger */}
					<div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
				</section>
			</div>

			<div className="flex flex-col gap-10 items-center text-center mt-20 px-4">
				<div className="flex flex-col gap-1.5 items-center text-sm leading-5 tracking-[0.14px]">
					<p className="font-medium text-white/[0.48]">Handcrafted by</p>
					<a
						href="https://outpacestudios.com"
						target="_blank"
						className="font-semibold text-white/[0.88]"
						rel="noopener"
					>
						Outpace Studios
					</a>
				</div>
				<p className="text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
					Free to use, licensed under the{" "}
					<a
						href="https://opensource.org/license/mit"
						target="_blank"
						rel="noopener"
					>
						MIT license
					</a>
					.
				</p>
			</div>

			<PatternSwitch
				value={pattern}
				onChange={setPattern}
				hidden={toastActive}
			/>
			{/* Same slot as the switch, the two swap in place. */}
			<Toast bottomClassName="bottom-6" onActiveChange={setToastActive} />
		</div>
	);
}
