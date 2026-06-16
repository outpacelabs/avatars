"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GradientAvatar } from "@/components/GradientAvatar";
import { IconButton } from "@/components/IconButton";
import { OutpaceLogo, SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";
import { drawMeshGradient } from "@/lib/avatars/mesh-gradient";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

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

/** Copyable `npm i @outpacelabs/avatars` command — the hero's primary CTA. */
function NpmInstall() {
	return (
		<button
			type="button"
			title="Copy install command"
			onClick={() => {
				void navigator.clipboard
					?.writeText("npm i @outpacelabs/avatars")
					.then(() => {
						window.dispatchEvent(new CustomEvent("show-toast"));
					});
			}}
			className="group/npm flex h-12 items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.05] pl-5 pr-2 transition-colors hover:bg-white/[0.08] cursor-pointer"
		>
			<span className="font-mono text-sm leading-5 text-white/[0.4] select-none">
				$
			</span>
			<span className="font-mono text-sm leading-5 text-white/[0.88]">
				npm i @outpacelabs/avatars
			</span>
			<span className="grid size-8 shrink-0 place-items-center rounded-full text-white/[0.4] transition-colors group-hover/npm:bg-white/[0.08] group-hover/npm:text-white/[0.88]">
				<svg
					aria-hidden="true"
					width="14"
					height="14"
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
			</span>
		</button>
	);
}

const POOL_SIZE = 30;
const EXPORT_SIZE = 2000;

const DEFAULT_HERO_SEED = "";

function randomSeed(): string {
	return Math.random().toString(36).slice(2, 10);
}

function randomPool(): string[] {
	return Array.from({ length: POOL_SIZE }, randomSeed);
}

/**
 * Deterministic first batch so the grid renders server-side at full height —
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
 * Render a seed's gradient at 2000×2000 (matching the original baked assets).
 * Bakes in the same ~6% blur the live avatars use, scaled up slightly so the
 * blur's transparent edges fall outside the frame (avoids a dark ring).
 * Fully client-side — nothing is stored server-side.
 */
function renderGradientCanvas(seed: string): HTMLCanvasElement | null {
	const base = document.createElement("canvas");
	base.width = EXPORT_SIZE;
	base.height = EXPORT_SIZE;
	const bctx = base.getContext("2d");
	if (!bctx) return null;
	drawMeshGradient(bctx, seed, EXPORT_SIZE);

	const out = document.createElement("canvas");
	out.width = EXPORT_SIZE;
	out.height = EXPORT_SIZE;
	const octx = out.getContext("2d");
	if (!octx) return null;
	const blur = Math.round(EXPORT_SIZE * 0.06);
	const scale = 1.18;
	const dw = EXPORT_SIZE * scale;
	const offset = (dw - EXPORT_SIZE) / 2;
	octx.filter = `blur(${blur}px)`;
	octx.drawImage(base, -offset, -offset, dw, dw);
	octx.filter = "none";
	return out;
}

function gradientBlob(
	seed: string,
	type: string,
	quality?: number,
): Promise<Blob | null> {
	const canvas = renderGradientCanvas(seed);
	if (!canvas) return Promise.resolve(null);
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function downloadGradient(seed: string): Promise<void> {
	const blob = await gradientBlob(seed, "image/jpeg", 0.92);
	if (!blob) return;
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `gradient-${sanitizeFilename(seed)}.jpg`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/** Copy the gradient as a PNG to the clipboard. Returns false if unsupported. */
async function copyGradient(seed: string): Promise<boolean> {
	try {
		const item = new ClipboardItem({
			"image/png": gradientBlob(seed, "image/png") as Promise<Blob>,
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
}: {
	seed: string;
	index: number;
	canCopy: boolean;
}) {
	const reducedMotion = usePrefersReducedMotion();

	const copy = () => {
		void copyGradient(seed).then((ok) => {
			if (ok) window.dispatchEvent(new CustomEvent("show-toast"));
		});
	};

	return (
		<motion.div
			initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: 0.45,
				delay: (index % POOL_SIZE) * 0.025,
				ease: [0.22, 1, 0.36, 1],
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
				<div className="size-[80px] md:size-[96px] transition-transform duration-200 motion-safe:group-hover:scale-105">
					<GradientAvatar seed={seed} size={96} />
				</div>
			</button>

			<span className="absolute top-4 left-4 md:top-5 md:left-5 text-[10px] font-medium text-white/[0.4] leading-4 tracking-[0.12px] tabular-nums pointer-events-none">
				{(index + 1).toString().padStart(3, "0")}
			</span>

			<span className="absolute top-4 right-4 md:top-5 md:right-5 max-w-[50%] text-[10px] font-mono text-white/[0.4] leading-4 tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none">
				{seed}
			</span>

			<div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4 flex items-center justify-end gap-1 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
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
					onClick={() => void downloadGradient(seed)}
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
	const [pool, setPool] = useState<string[]>(initialPool);
	const [showTopBlur, setShowTopBlur] = useState(false);
	const [canCopy, setCanCopy] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const reducedMotion = usePrefersReducedMotion();

	// Cursor parallax for the hero gradient (spring-smoothed tilt).
	const tiltX = useMotionValue(0);
	const tiltY = useMotionValue(0);
	const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-12, 12]), {
		stiffness: 150,
		damping: 18,
	});
	const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [12, -12]), {
		stiffness: 150,
		damping: 18,
	});

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

	// Cursor parallax: feed normalized pointer position into the tilt springs.
	useEffect(() => {
		if (reducedMotion) return;
		const onMove = (e: MouseEvent) => {
			tiltX.set(e.clientX / window.innerWidth - 0.5);
			tiltY.set(e.clientY / window.innerHeight - 0.5);
		};
		const onLeave = () => {
			tiltX.set(0);
			tiltY.set(0);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseleave", onLeave);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseleave", onLeave);
		};
	}, [reducedMotion, tiltX, tiltY]);

	const copyHero = useCallback(() => {
		void copyGradient(heroSeed).then((ok) => {
			if (ok) window.dispatchEvent(new CustomEvent("show-toast"));
		});
	}, [heroSeed]);

	const exportHero = useCallback(() => {
		void downloadGradient(heroSeed);
	}, [heroSeed]);

	return (
		<div className="relative flex flex-col items-center min-h-screen pb-24 overflow-x-clip">
			{/* Top scroll fade */}
			<div
				className={`fixed top-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
					showTopBlur ? "opacity-100" : "opacity-0"
				}`}
				style={{
					background:
						"linear-gradient(to bottom, #0A0A0A 0%, transparent 100%)",
				}}
			/>

			<div className="flex flex-col items-center w-full pt-16 sm:pt-10 gap-6">
				<OutpaceLogo />

				{/* WALL — the hero lives as a 2×2 feature in the top-left */}
				<section className="w-full px-4 flex flex-col gap-3">
					<SiteHeader />

					{/* HERO */}
					<div className="flex flex-col items-center text-center gap-6 px-4 pt-14 pb-12 sm:pt-20 sm:pb-16">
						<div className="flex flex-col items-center gap-4 max-w-2xl">
							<h1 className="text-4xl sm:text-5xl md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.05] text-white">
								A unique gradient for every seed
							</h1>
							<p className="text-base sm:text-lg text-white/[0.56] leading-7 max-w-md">
								The same seed always renders the same gradient — no stored
								images, no network. Drop the React component in, or copy any
								gradient below.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row items-center gap-3">
							<NpmInstall />
							<Link
								href="/docs"
								className="flex h-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] px-6 text-sm font-semibold leading-5 text-white/[0.88] transition-colors hover:bg-white/[0.08]"
							>
								Documentation
							</Link>
						</div>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
						{/* HERO (2 cols × 2 rows) — the whole card focuses the seed input */}
						<label className="col-span-2 row-span-2 relative flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white/[0.04] p-4 sm:p-6 cursor-text">
							<motion.div
								className="will-change-transform"
								style={{ rotateX, rotateY, transformPerspective: 800 }}
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
									<GradientAvatar seed={heroSeed} size={160} />
								</motion.div>
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
						</label>

						{pool.map((seed, index) => (
							<GradientCard
								key={seed}
								seed={seed}
								index={index}
								canCopy={canCopy}
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

			<Toast />
		</div>
	);
}
