"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { PackageSwitcher } from "@/components/PackageSwitcher";
import { SiteHeader } from "@/components/SiteHeader";
import { drawMeshGradient } from "@/lib/avatars/mesh-gradient";
import { useScrollSpy } from "@/lib/use-scroll-spy";

/*
 * Docs styled after the Outpace "Liquid Glass" article (outpacelabs/glass):
 * a thin ~640px reading column, understated small typography, generous section
 * spacing, a right-gutter table of contents with a dot that snaps to the active
 * section, and borderless rounded code surfaces — kept in dark mode.
 */

// Dark-mode equivalents of the article's ink/body/muted text tokens.
const INK = "rgba(255,255,255,0.92)";
const BODY = "rgba(255,255,255,0.62)";
const MUTED = "rgba(255,255,255,0.42)";
const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

/* ── reading column ──
 * Each section's column fades + slides up as it scrolls into view (the docs'
 * equivalent of the home grid's entrance). Same ease-out curve AND duration as
 * the home cards (timing-consistent); reduced motion renders it statically.
 * Transform + opacity only — no reflow, so the sticky header and TOC
 * scroll-spy are unaffected. */
function Col({ children }: { children: ReactNode }) {
	const reduced = useReducedMotion() ?? false;
	return (
		<motion.div
			style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}
			initial={reduced ? false : { opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -64px 0px" }}
			transition={
				reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
			}
		>
			{children}
		</motion.div>
	);
}

function H2({ children }: { children: ReactNode }) {
	return (
		<h2
			style={{
				fontSize: 15,
				fontWeight: 450,
				color: INK,
				letterSpacing: "-0.1px",
				margin: "80px 0 0",
				textWrap: "balance",
			}}
		>
			{children}
		</h2>
	);
}

function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
	return (
		<p
			style={{
				fontSize: 14,
				lineHeight: 1.72,
				letterSpacing: "0.1px",
				color: muted ? MUTED : BODY,
				margin: "16px 0 0",
				textWrap: "pretty",
			}}
		>
			{children}
		</p>
	);
}

function A({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			style={{
				color: INK,
				textDecoration: "underline",
				textDecorationColor: "rgba(255,255,255,0.9)",
				textUnderlineOffset: "2px",
			}}
		>
			{children}
		</a>
	);
}

/* Inline code. */
function C({ children }: { children: ReactNode }) {
	return (
		<code
			style={{
				fontFamily: MONO,
				fontSize: "0.84em",
				background: "rgba(255,255,255,0.05)",
				borderRadius: 6,
				padding: "3px 5px",
				color: INK,
			}}
		>
			{children}
		</code>
	);
}

/* Borderless rounded code surface with server-rendered Shiki highlighting.
   The container owns the surface; the theme only colors the tokens (its own
   background is overridden to transparent in the global style below). */
function Code({ html }: { html: string }) {
	return (
		<div
			className="docs-code"
			style={{
				margin: "22px 0 0",
				borderRadius: 16,
				overflow: "hidden",
				background: "rgba(255,255,255,0.04)",
			}}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

/* ── live avatar preview (mirrors the published GradientAvatar) ── */
const RENDER_SIZE = 256;

function Avatar({
	seed,
	size = 32,
	radius = "9999px",
}: {
	seed: number | string;
	size?: number;
	radius?: number | string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
		drawMeshGradient(ctx, seed, RENDER_SIZE);
	}, [seed]);

	const blurPx = Math.max(1, Math.round(size * 0.06));

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
					filter: `blur(${blurPx}px)`,
				}}
			/>
		</span>
	);
}

function Preview({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				justifyContent: "center",
				gap: 24,
				margin: "22px 0 0",
				borderRadius: 16,
				background: "rgba(255,255,255,0.04)",
				padding: 24,
			}}
		>
			{children}
		</div>
	);
}

function PreviewLabel({ children }: { children: ReactNode }) {
	return (
		<span style={{ fontSize: 11, color: MUTED, fontFamily: MONO }}>
			{children}
		</span>
	);
}

/* ── right-gutter table of contents (dot snaps to the active section) ── */
const TOC: { id: string; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "installation", label: "Installation" },
	{ id: "usage", label: "Usage" },
	{ id: "props", label: "Props" },
	{ id: "examples", label: "Sizes & shapes" },
	{ id: "engine", label: "Engine helpers" },
	{ id: "license", label: "License" },
];

const TOC_ITEM_H = 28;

function TableOfContents() {
	const reduced = useReducedMotion() ?? false;
	const [wide, setWide] = useState(false);
	const { active, scrollToId } = useScrollSpy({
		ids: TOC.map((it) => it.id),
		topOffset: 96,
	});

	useEffect(() => {
		const setW = () => setWide(window.innerWidth >= 1080);
		setW();
		window.addEventListener("resize", setW);
		return () => window.removeEventListener("resize", setW);
	}, []);

	if (!wide) return null;

	return (
		<aside
			aria-label="Contents"
			style={{
				position: "absolute",
				top: 0,
				right: 0,
				height: "100%",
				width: 196,
			}}
		>
			<motion.nav
				// Opacity-only fade-in (a transform would break the sticky nav).
				initial={reduced ? false : { opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={reduced ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
				style={{
					position: "sticky",
					top: 80,
					// Lands the first item on the first line of body copy. The TOC only
					// shows at ≥1080px, where the container's sm:pt-20 (80px) always
					// applies, so a fixed offset stays aligned across the range.
					marginTop: 94,
					paddingLeft: 13,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<style>{`.toc-link:hover{color:rgba(255,255,255,0.74) !important}`}</style>
				<motion.span
					aria-hidden
					animate={{ y: active * TOC_ITEM_H + TOC_ITEM_H / 2 - 3 }}
					transition={
						reduced
							? { duration: 0 }
							: { type: "spring", stiffness: 520, damping: 34 }
					}
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						width: 6,
						height: 6,
						borderRadius: 99,
						background: "rgba(255,255,255,0.92)",
						pointerEvents: "none",
						display: "none", // hidden for now (matches glass)
					}}
				/>
				{TOC.map((it, i) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						className="toc-link"
						aria-current={i === active ? "true" : undefined}
						onClick={(e) => {
							e.preventDefault();
							scrollToId(it.id);
						}}
						style={{
							display: "flex",
							alignItems: "center",
							height: TOC_ITEM_H,
							textDecoration: "none",
							fontSize: 14,
							letterSpacing: "0.1px",
							cursor: "pointer",
							color: i === active ? INK : MUTED,
							transition: "color 200ms ease",
						}}
					>
						{it.label}
					</a>
				))}
			</motion.nav>
		</aside>
	);
}

const SECTION: CSSProperties = { scrollMarginTop: 96 };

const PROPS: { name: string; type: string; def: string; desc: string }[] = [
	{
		name: "seed",
		type: "string | number",
		def: "None",
		desc: "Any value; each unique seed is a unique gradient.",
	},
	{ name: "size", type: "number", def: "32", desc: "Rendered size in pixels." },
	{
		name: "radius",
		type: "number | string",
		def: '"9999px"',
		desc: "Corner radius. Number = pixels, string = any CSS length. Pass 0 for a square.",
	},
	{
		name: "className",
		type: "string",
		def: "None",
		desc: "Extra classes on the wrapper span.",
	},
	{
		name: "style",
		type: "CSSProperties",
		def: "None",
		desc: "Extra inline styles merged onto the wrapper.",
	},
];

const HELPERS: { sig: string; desc: string }[] = [
	{
		sig: "drawMeshGradient(ctx, seed, size)",
		desc: "Paint the raw mesh into a 2D canvas context. The lowest-level primitive.",
	},
	{
		sig: "renderGradient(canvas, seed, options?)",
		desc: "Render a seed into a canvas with the signature soft blur baked in.",
	},
	{
		sig: "gradientToDataURL(seed, options?) → string",
		desc: "Render and return a data URL. Handy for <img src>, downloads, or copy.",
	},
	{
		sig: "gradientToBlob(seed, options?) → Promise<Blob | null>",
		desc: "Render and resolve a Blob, e.g. to write to the clipboard.",
	},
	{
		sig: "generatePalette(seed) → GradientPalette",
		desc: "The colors and harmony rule behind a seed, without painting anything.",
	},
	{
		sig: "seedFromString(input) → number / toSeed(seed) → number",
		desc: "The deterministic hashing used to turn any value into a numeric seed.",
	},
];

export function DocsContent({
	highlighted,
	install,
}: {
	highlighted: Record<string, string>;
	install: { id: string; command: string }[];
}) {
	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				paddingBottom: 96,
				overflowX: "clip",
			}}
		>
			{/* Shiki blocks: let our flat surface own the background; the theme
			    only colors the tokens. */}
			<style>{`.docs-code .shiki{margin:0;padding:16px 18px;overflow-x:auto;line-height:1.65;background:transparent !important;font-family:${MONO};font-size:13px}
.docs-code .shiki code{font-family:inherit;background:transparent;padding:0}`}</style>
			<div className="flex flex-col items-center w-full pt-3 gap-6">
				<section className="w-full px-4 flex flex-col gap-3">
					<SiteHeader />

					{/* article body: 1080 container (like the glass article) holding the
					    centered 640 column + the right-gutter TOC. Top padding matches
					    the home hero's (pt-14/sm:pt-20) so both pages start the same
					    distance below the header. */}
					<div
						className="pt-14 sm:pt-20"
						style={{
							position: "relative",
							maxWidth: 1080,
							margin: "0 auto",
							width: "100%",
						}}
					>
						<TableOfContents />

						<main>
							{/* Overview */}
							<section id="overview" style={SECTION}>
								<Col>
									{/* Headline hidden by design, kept for SEO/accessibility. */}
									<h1 className="sr-only">Avatars</h1>
									<P>
										A deterministic mesh-gradient avatar for any seed, rendered
										on a <C>&lt;canvas&gt;</C>. The same seed always yields the
										same gradient, with no stored images and no network.
										Self-contained: the gradient engine is bundled in.
									</P>
								</Col>
							</section>

							{/* Installation */}
							<section id="installation" style={SECTION}>
								<Col>
									<H2>Installation</H2>
									<P>
										Install with your package manager of choice. React 18 or
										newer is the only peer dependency.
									</P>
									<PackageSwitcher items={install} />
								</Col>
							</section>

							{/* Usage */}
							<section id="usage" style={SECTION}>
								<Col>
									<H2>Usage</H2>
									<P>
										Import the component and give it a <C>seed</C>. That&apos;s
										it: the same seed always renders the same gradient, so a
										user id or email is a stable avatar with nothing to store.
									</P>
									<Code html={highlighted.usage} />
								</Col>
							</section>

							{/* Props */}
							<section id="props" style={SECTION}>
								<Col>
									<H2>Props</H2>
									<div
										style={{
											margin: "22px 0 0",
											borderRadius: 16,
											overflow: "hidden",
											background: "rgba(255,255,255,0.04)",
											fontSize: 13,
										}}
									>
										{PROPS.map((p, i) => (
											<div
												key={p.name}
												style={{
													display: "grid",
													gridTemplateColumns: "1fr 1.3fr 2fr",
													gap: 16,
													padding: "12px 16px",
													borderTop:
														i === 0
															? undefined
															: "1px solid rgba(255,255,255,0.06)",
												}}
											>
												<span style={{ fontFamily: MONO, color: INK }}>
													{p.name}
												</span>
												<span style={{ fontFamily: MONO, color: BODY }}>
													{p.type}
												</span>
												<span style={{ color: BODY, lineHeight: 1.5 }}>
													{p.desc}
													{p.def !== "None" ? (
														<>
															{" "}
															Default <C>{p.def}</C>.
														</>
													) : null}
												</span>
											</div>
										))}
									</div>
								</Col>
							</section>

							{/* Sizes & shapes */}
							<section id="examples" style={SECTION}>
								<Col>
									<H2>Sizes &amp; shapes</H2>
									<P>
										<C>size</C> scales the avatar; <C>radius</C> reshapes it. It
										defaults to a full circle. Pass a number for a rounded
										square or <C>0</C> for a hard square.
									</P>
									<Preview>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 8,
											}}
										>
											<Avatar seed="studio" size={84} />
											<PreviewLabel>circle</PreviewLabel>
										</div>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 8,
											}}
										>
											<Avatar seed="studio" size={84} radius={18} />
											<PreviewLabel>radius=&#123;18&#125;</PreviewLabel>
										</div>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 8,
											}}
										>
											<Avatar seed="studio" size={84} radius={0} />
											<PreviewLabel>radius=&#123;0&#125;</PreviewLabel>
										</div>
									</Preview>
									<Code html={highlighted.examples} />
								</Col>
							</section>

							{/* Engine helpers */}
							<section id="engine" style={SECTION}>
								<Col>
									<H2>Engine helpers</H2>
									<P>
										The bundled engine is re-exported so you can render
										gradients outside React: to a data URL for an{" "}
										<C>&lt;img&gt;</C>, a Blob for the clipboard, or a
										full-resolution download.
									</P>
									<div
										style={{
											margin: "22px 0 0",
											borderRadius: 16,
											overflow: "hidden",
											background: "rgba(255,255,255,0.04)",
										}}
									>
										{HELPERS.map((h, i) => (
											<div
												key={h.sig}
												style={{
													display: "flex",
													flexDirection: "column",
													gap: 4,
													padding: "12px 16px",
													borderTop:
														i === 0
															? undefined
															: "1px solid rgba(255,255,255,0.06)",
												}}
											>
												<code
													style={{ fontFamily: MONO, fontSize: 13, color: INK }}
												>
													{h.sig}
												</code>
												<span
													style={{
														fontSize: 13,
														color: BODY,
														lineHeight: 1.5,
													}}
												>
													{h.desc}
												</span>
											</div>
										))}
									</div>
									<Code html={highlighted.engine} />
									<P muted>
										Types are exported too: <C>GradientPalette</C>,{" "}
										<C>Harmony</C>, <C>RenderOptions</C>, and{" "}
										<C>ExportOptions</C>.
									</P>
								</Col>
							</section>

							{/* License */}
							<section id="license" style={SECTION}>
								<Col>
									<H2>License</H2>
									<P>
										Free to use under the{" "}
										<A href="https://opensource.org/license/mit">MIT license</A>
										. Use it anywhere, commercial or not, no attribution
										required.
									</P>
									<div style={{ height: 56 }} />
								</Col>
							</section>
						</main>
					</div>
				</section>
			</div>

			{/* Thin divider above the footer, same as glass (dark-mode: black → white). */}
			<div
				aria-hidden
				style={{
					width: 40,
					height: 1,
					background: "rgba(255,255,255,0.12)",
					margin: "64px auto 0",
				}}
			/>

			{/* Footer — the glass article's sign-off, dark-mode adapted. */}
			<footer style={{ padding: "64px 24px 96px", textAlign: "center" }}>
				<div
					style={{
						display: "inline-flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 24,
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 8,
						}}
					>
						{/* name — <H2> weight/tracking/colour at body size (14) */}
						<p
							style={{
								margin: 0,
								fontSize: 14,
								lineHeight: 1.3,
								fontWeight: 450,
								letterSpacing: "-0.1px",
								color: INK,
							}}
						>
							By Outpace Studios
						</p>
						{/* tagline — <P> size/colour, tighter leading; the manual break
						    keeps "for" on the first line */}
						<p
							style={{
								margin: 0,
								fontSize: 14,
								lineHeight: 1.45,
								letterSpacing: "0.1px",
								color: BODY,
							}}
						>
							Brands, interfaces, and motion for
							<br />
							venture-backed companies
						</p>
					</div>
					{/* links use our <A> style, at the 14px body size */}
					<div style={{ display: "flex", gap: 16, fontSize: 14 }}>
						<A href="https://outpacestudios.com">Website</A>
						<A href="https://x.com/outpacestudios">X / Twitter</A>
					</div>
				</div>
			</footer>
		</div>
	);
}
