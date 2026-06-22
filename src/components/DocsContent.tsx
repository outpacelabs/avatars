"use client";

import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { OutpaceLogo, SiteHeader } from "@/components/SiteHeader";
import { drawMeshGradient } from "@/lib/avatars/mesh-gradient";

/*
 * Docs styled after the Outpace "Liquid Glass" article (outpacelabs/glass):
 * a thin ~640px reading column, understated small typography, generous section
 * spacing, a right-gutter table of contents with a dot that snaps to the active
 * section, and borderless rounded code surfaces — kept in dark mode.
 */

// Dark-mode equivalents of the article's ink/body/muted text tokens.
const INK = "rgba(255,255,255,0.92)";
const BODY = "rgba(255,255,255,0.60)";
const MUTED = "rgba(255,255,255,0.42)";
const MONO =
	"ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

/* ── reading column ── */
function Col({ children }: { children: ReactNode }) {
	return (
		<div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
			{children}
		</div>
	);
}

function H1({ children }: { children: ReactNode }) {
	return (
		<h1
			style={{
				fontSize: 24,
				fontWeight: 550,
				color: INK,
				letterSpacing: "-0.4px",
				lineHeight: 1.2,
				margin: 0,
				textWrap: "balance",
			}}
		>
			{children}
		</h1>
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
				textDecorationColor: "rgba(255,255,255,0.6)",
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
				background: "rgba(255,255,255,0.06)",
				borderRadius: 6,
				padding: "3px 5px",
				color: INK,
			}}
		>
			{children}
		</code>
	);
}

/* Borderless rounded code surface, matching the article. */
function Code({
	children,
	style,
}: {
	children: string;
	style?: CSSProperties;
}) {
	return (
		<pre
			style={{
				margin: "22px 0 0",
				borderRadius: 16,
				overflowX: "auto",
				background: "rgba(255,255,255,0.04)",
				padding: "16px 18px",
				fontFamily: MONO,
				fontSize: 13,
				lineHeight: 1.65,
				color: "rgba(255,255,255,0.82)",
				...style,
			}}
		>
			<code>{children}</code>
		</pre>
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
				alignItems: "flex-end",
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

const TOC_ITEM_H = 32;

function TableOfContents() {
	const [wide, setWide] = useState(false);
	const [active, setActive] = useState(0);
	const ptsRef = useRef<number[]>(TOC.map((_, i) => i * 1000));

	useEffect(() => {
		const setW = () => setWide(window.innerWidth >= 1080);
		setW();
		window.addEventListener("resize", setW);
		return () => window.removeEventListener("resize", setW);
	}, []);

	useEffect(() => {
		const pickActive = (y: number) => {
			const p = ptsRef.current;
			let idx = 0;
			for (let i = 0; i < p.length; i++) if (y >= p[i]) idx = i;
			setActive(idx);
		};
		const measure = () => {
			const maxScroll = Math.max(
				1,
				document.documentElement.scrollHeight - window.innerHeight,
			);
			const p = TOC.map((it, i) => {
				const el = document.getElementById(it.id);
				return el
					? el.getBoundingClientRect().top +
							window.scrollY -
							window.innerHeight * 0.4
					: i * 1000;
			});
			p[p.length - 1] = maxScroll;
			for (let i = p.length - 2; i >= 0; i--)
				if (p[i] >= p[i + 1]) p[i] = p[i + 1] - 1;
			ptsRef.current = p;
			pickActive(window.scrollY);
		};
		measure();
		const t = setTimeout(measure, 150);
		const onScroll = () => pickActive(window.scrollY);
		window.addEventListener("resize", measure);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			clearTimeout(t);
			window.removeEventListener("resize", measure);
			window.removeEventListener("scroll", onScroll);
		};
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
			<nav
				style={{
					position: "sticky",
					top: 128,
					marginTop: 100,
					paddingLeft: 18,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<style>{`.toc-link:hover{color:rgba(255,255,255,0.74) !important}`}</style>
				<span
					aria-hidden
					style={{
						position: "absolute",
						left: 0,
						top: active * TOC_ITEM_H + TOC_ITEM_H / 2 - 3,
						width: 6,
						height: 6,
						borderRadius: 99,
						background: "rgba(255,255,255,0.92)",
						transition: "top 240ms cubic-bezier(0.22,1,0.36,1)",
						pointerEvents: "none",
					}}
				/>
				{TOC.map((it, i) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						className="toc-link"
						onClick={(e) => {
							e.preventDefault();
							document
								.getElementById(it.id)
								?.scrollIntoView({ behavior: "smooth", block: "start" });
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
			</nav>
		</aside>
	);
}

const SECTION: CSSProperties = { scrollMarginTop: 96 };

const PROPS: { name: string; type: string; def: string; desc: string }[] = [
	{
		name: "seed",
		type: "string | number",
		def: "—",
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
		def: "—",
		desc: "Extra classes on the wrapper span.",
	},
	{
		name: "style",
		type: "CSSProperties",
		def: "—",
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
		desc: "Render and resolve a Blob — e.g. to write to the clipboard.",
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

const HERO_SEEDS = ["outpace", "jane@example.com", "avatars", "42", "studio"];

export function DocsContent() {
	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				paddingBottom: 96,
				overflowX: "clip",
			}}
		>
			<div className="flex flex-col items-center w-full pt-16 sm:pt-10 gap-6">
				<OutpaceLogo />

				<section className="w-full px-4 flex flex-col gap-3">
					<SiteHeader />

					{/* article body: centered 640 column + right-gutter TOC */}
					<div style={{ position: "relative", width: "100%", paddingTop: 24 }}>
						<TableOfContents />

						<main>
							{/* Overview */}
							<section id="overview" style={SECTION}>
								<Col>
									<div style={{ paddingTop: 8 }}>
										<H1>
											<span style={{ fontFamily: MONO }}>
												@outpacelabs/avatars
											</span>
										</H1>
									</div>
									<P>
										A deterministic mesh-gradient avatar for any seed, rendered
										on a <C>&lt;canvas&gt;</C> — the same seed always yields the
										same gradient, with no stored images and no network.
										Self-contained: the gradient engine is bundled in.
									</P>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											marginTop: 24,
										}}
									>
										{HERO_SEEDS.map((seed) => (
											<Avatar key={seed} seed={seed} size={56} />
										))}
									</div>
									<Code>npm i @outpacelabs/avatars</Code>
									<div
										style={{
											display: "flex",
											gap: 18,
											marginTop: 18,
											fontSize: 13,
											color: MUTED,
										}}
									>
										<A href="https://www.npmjs.com/package/@outpacelabs/avatars">
											npm ↗
										</A>
										<A href="https://github.com/outpacelabs/avatars">
											GitHub ↗
										</A>
										<span>MIT</span>
									</div>
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
									<Code>{`npm i @outpacelabs/avatars
pnpm add @outpacelabs/avatars
yarn add @outpacelabs/avatars
bun add @outpacelabs/avatars`}</Code>
								</Col>
							</section>

							{/* Usage */}
							<section id="usage" style={SECTION}>
								<Col>
									<H2>Usage</H2>
									<P>
										Import the component and give it a <C>seed</C>. That&apos;s
										it — the same seed always renders the same gradient, so a
										user id or email is a stable avatar with nothing to store.
									</P>
									<Code>{`import { GradientAvatar } from "@outpacelabs/avatars";

export function Avatar({ user }) {
  return <GradientAvatar seed={user.id} size={96} />;
}`}</Code>
									<Preview>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 8,
											}}
										>
											<Avatar seed="jane@example.com" size={96} />
											<PreviewLabel>jane@example.com</PreviewLabel>
										</div>
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 8,
											}}
										>
											<Avatar seed="jane@example.com" size={96} />
											<PreviewLabel>same seed → same gradient</PreviewLabel>
										</div>
									</Preview>
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
													{p.def !== "—" ? (
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
										defaults to a full circle — pass a number for a rounded
										square or <C>0</C> for a hard square.
									</P>
									<Preview>
										<div
											style={{
												display: "flex",
												flexWrap: "wrap",
												alignItems: "flex-end",
												gap: 20,
											}}
										>
											<Avatar seed="outpace" size={32} />
											<Avatar seed="outpace" size={48} />
											<Avatar seed="outpace" size={72} />
											<Avatar seed="outpace" size={96} />
										</div>
									</Preview>
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
									<Code>{`<GradientAvatar seed="studio" size={84} />            // circle
<GradientAvatar seed="studio" size={84} radius={18} /> // rounded square
<GradientAvatar seed="studio" size={84} radius={0} />  // square`}</Code>
								</Col>
							</section>

							{/* Engine helpers */}
							<section id="engine" style={SECTION}>
								<Col>
									<H2>Engine helpers</H2>
									<P>
										The bundled engine is re-exported so you can render
										gradients outside React — to a data URL for an{" "}
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
									<Code>{`import { gradientToDataURL, generatePalette } from "@outpacelabs/avatars";

// A 512×512 PNG data URL, no React required.
const src = gradientToDataURL("jane@example.com", { size: 512 });

// Just the colors behind a seed.
const { colors, harmony } = generatePalette("jane@example.com");`}</Code>
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
										<A href="https://opensource.org/license/mit">MIT license</A>{" "}
										— use it anywhere, commercial or not, no attribution
										required.
									</P>
									<div style={{ height: 56 }} />
								</Col>
							</section>
						</main>
					</div>
				</section>
			</div>

			{/* Footer */}
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
			</div>
		</div>
	);
}
