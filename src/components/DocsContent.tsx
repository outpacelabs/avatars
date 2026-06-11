"use client";

import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { OutpaceLogo, SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";
import { drawMeshGradient } from "@/lib/avatars/mesh-gradient";

/** Internal render resolution — matches the published component. */
const RENDER_SIZE = 256;

/**
 * Mirrors `GradientAvatar` from `@outpacelabs/avatars` (including `radius`/
 * `style`) so the docs previews render exactly what the package produces,
 * using the same bundled engine.
 */
function Avatar({
	seed,
	size = 32,
	radius = "9999px",
	className,
	style,
}: {
	seed: number | string;
	size?: number;
	radius?: number | string;
	className?: string;
	style?: CSSProperties;
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
			className={className}
			style={{
				display: "inline-block",
				overflow: "hidden",
				borderRadius: radius,
				width: size,
				height: size,
				...style,
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

function Section({
	id,
	eyebrow,
	title,
	children,
}: {
	id: string;
	eyebrow: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section id={id} className="scroll-mt-24 flex flex-col gap-5">
			<div className="flex flex-col gap-1.5">
				<span className="text-xs font-semibold text-white/[0.4] leading-4">
					{eyebrow}
				</span>
				<h2 className="text-xl font-semibold text-white/[0.88] leading-7 tracking-[-0.01em]">
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}

/** A bordered surface used for live previews. */
function Preview({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-wrap items-end gap-6 rounded-[14px] bg-white/[0.04] border border-white/[0.06] p-6">
			{children}
		</div>
	);
}

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
		desc: "Extra classes on the wrapper <span>.",
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

const NAV: { group: string; items: { id: string; label: string }[] }[] = [
	{
		group: "Get started",
		items: [
			{ id: "overview", label: "Overview" },
			{ id: "installation", label: "Installation" },
			{ id: "usage", label: "Usage" },
		],
	},
	{
		group: "API",
		items: [
			{ id: "props", label: "Props" },
			{ id: "examples", label: "Sizes & shapes" },
		],
	},
	{
		group: "Advanced",
		items: [{ id: "engine", label: "Engine helpers" }],
	},
	{
		group: "About",
		items: [{ id: "license", label: "License" }],
	},
];

const SECTION_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

function Sidebar({
	active,
	onJump,
}: {
	active: string;
	onJump: (id: string) => void;
}) {
	return (
		<nav className="flex flex-col gap-7">
			{NAV.map((group) => (
				<div key={group.group} className="flex flex-col gap-1">
					<span className="px-2.5 pb-1.5 text-xs font-semibold text-white/[0.4]">
						{group.group}
					</span>
					{group.items.map((item) => {
						const isActive = active === item.id;
						return (
							<a
								key={item.id}
								href={`#${item.id}`}
								onClick={(e) => {
									e.preventDefault();
									onJump(item.id);
								}}
								aria-current={isActive ? "true" : undefined}
								className={`rounded-[7px] px-2.5 py-1.5 text-sm leading-5 tracking-[0.14px] transition-colors ${
									isActive
										? "bg-white/[0.06] text-white/[0.88] font-medium"
										: "text-white/[0.5] hover:text-white/[0.88] hover:bg-white/[0.03]"
								}`}
							>
								{item.label}
							</a>
						);
					})}
				</div>
			))}
		</nav>
	);
}

export function DocsContent() {
	const [active, setActive] = useState("overview");
	const [showTopBlur, setShowTopBlur] = useState(false);

	// Scroll-spy against the window: the earliest section still below the sticky
	// header band wins the active state.
	useEffect(() => {
		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) visible.add(e.target.id);
					else visible.delete(e.target.id);
				}
				const current = SECTION_IDS.find((id) => visible.has(id));
				if (current) setActive(current);
			},
			{ rootMargin: "-96px 0px -65% 0px", threshold: [0, 1] },
		);
		for (const id of SECTION_IDS) {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	}, []);

	// Same top scroll-fade as the home page.
	useEffect(() => {
		const handleScroll = () => setShowTopBlur(window.scrollY > 50);
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const jump = (id: string) => {
		document.getElementById(id)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
		setActive(id);
	};

	return (
		<div className="relative flex flex-col items-center min-h-screen pb-24 overflow-x-clip">
			{/* Top scroll fade — identical to the home page */}
			<div
				className={`fixed top-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
					showTopBlur ? "opacity-100" : "opacity-0"
				}`}
				style={{
					background:
						"linear-gradient(to bottom, #0A0A0A 0%, transparent 100%)",
				}}
			/>

			{/* HEADER — same structure/position as home: no layout shift */}
			<div className="flex flex-col items-center w-full pt-16 sm:pt-10 gap-6">
				<OutpaceLogo />

				<section className="w-full px-4 flex flex-col gap-3">
					<SiteHeader />

					{/* BODY — sidebar is taken out of flow (absolute + sticky inner) and
					    pinned flush-left under "Avatars", so the reading column centers
					    on the full page rather than the space beside it. */}
					<div className="relative w-full pt-6">
						<aside className="hidden xl:block absolute left-0 top-6 bottom-0 w-52 pl-2.5">
							<div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-10">
								<Sidebar active={active} onJump={jump} />
							</div>
						</aside>

						<main className="mx-auto w-full max-w-2xl">
							<div className="flex flex-col gap-16">
								{/* OVERVIEW / HERO */}
								<section
									id="overview"
									className="scroll-mt-24 flex flex-col gap-6"
								>
									<div className="flex flex-col gap-3">
										<span className="text-xs font-semibold text-white/[0.4] leading-4">
											React component
										</span>
										<h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em] leading-9 font-mono">
											@outpacelabs/avatars
										</h1>
										<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
											A deterministic mesh-gradient avatar for any seed,
											rendered on a{" "}
											<code className="text-white/[0.72]">&lt;canvas&gt;</code>{" "}
											— the same seed always yields the same gradient, with no
											stored images and no network. Self-contained: the gradient
											engine is bundled in.
										</p>
									</div>

									<div className="flex items-center gap-3">
										{HERO_SEEDS.map((seed) => (
											<Avatar key={seed} seed={seed} size={56} />
										))}
									</div>

									<CodeBlock
										label="Terminal"
										code="npm i @outpacelabs/avatars"
									/>

									<div className="flex items-center gap-4 text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
										<a
											href="https://www.npmjs.com/package/@outpacelabs/avatars"
											target="_blank"
											rel="noopener"
											className="hover:text-white/[0.88] transition-colors"
										>
											npm ↗
										</a>
										<a
											href="https://github.com/outpacelabs/avatars"
											target="_blank"
											rel="noopener"
											className="hover:text-white/[0.88] transition-colors"
										>
											GitHub ↗
										</a>
										<span className="text-white/[0.32]">MIT</span>
									</div>
								</section>

								<Section
									id="installation"
									eyebrow="Get started"
									title="Installation"
								>
									<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
										Install with your package manager of choice. React 18 or
										newer is the only peer dependency.
									</p>
									<CodeBlock
										code={`npm i @outpacelabs/avatars
pnpm add @outpacelabs/avatars
yarn add @outpacelabs/avatars
bun add @outpacelabs/avatars`}
									/>
								</Section>

								<Section id="usage" eyebrow="Basics" title="Usage">
									<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
										Import the component and give it a <code>seed</code>.
										That&apos;s it — the same seed always renders the same
										gradient, so a user id or email is a stable avatar with
										nothing to store.
									</p>
									<CodeBlock
										label="avatar.tsx"
										code={`import { GradientAvatar } from "@outpacelabs/avatars";

export function Avatar({ user }) {
  return <GradientAvatar seed={user.id} size={96} />;
}`}
									/>
									<Preview>
										<div className="flex flex-col items-center gap-2">
											<Avatar seed="jane@example.com" size={96} />
											<code className="text-[11px] text-white/[0.4]">
												jane@example.com
											</code>
										</div>
										<div className="flex flex-col items-center gap-2">
											<Avatar seed="jane@example.com" size={96} />
											<code className="text-[11px] text-white/[0.4]">
												same seed → same gradient
											</code>
										</div>
									</Preview>
								</Section>

								<Section id="props" eyebrow="API" title="Props">
									<div className="overflow-hidden rounded-[14px] border border-white/[0.06]">
										<div className="hidden sm:grid grid-cols-[1.1fr_1.4fr_0.8fr_2.2fr] gap-4 px-4 py-3 bg-white/[0.04] text-xs font-semibold text-white/[0.4]">
											<span>Prop</span>
											<span>Type</span>
											<span>Default</span>
											<span>Description</span>
										</div>
										{PROPS.map((p) => (
											<div
												key={p.name}
												className="grid grid-cols-1 sm:grid-cols-[1.1fr_1.4fr_0.8fr_2.2fr] gap-1 sm:gap-4 px-4 py-3 border-t border-white/[0.06] text-sm leading-6"
											>
												<span className="font-mono text-white/[0.88]">
													{p.name}
												</span>
												<span className="font-mono text-[13px] text-white/[0.56]">
													{p.type}
												</span>
												<span className="font-mono text-[13px] text-white/[0.56]">
													{p.def}
												</span>
												<span className="text-white/[0.56] tracking-[0.14px]">
													{p.desc}
												</span>
											</div>
										))}
									</div>
								</Section>

								<Section id="examples" eyebrow="Recipes" title="Sizes & shapes">
									<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
										<code>size</code> scales the avatar; <code>radius</code>{" "}
										reshapes it. It defaults to a full circle — pass a number
										for a rounded square or <code>0</code> for a hard square.
									</p>
									<Preview>
										<div className="flex flex-wrap items-end gap-5">
											<Avatar seed="outpace" size={32} />
											<Avatar seed="outpace" size={48} />
											<Avatar seed="outpace" size={72} />
											<Avatar seed="outpace" size={96} />
										</div>
									</Preview>
									<Preview>
										<div className="flex flex-col items-center gap-2">
											<Avatar seed="studio" size={84} />
											<code className="text-[11px] text-white/[0.4]">
												circle
											</code>
										</div>
										<div className="flex flex-col items-center gap-2">
											<Avatar seed="studio" size={84} radius={18} />
											<code className="text-[11px] text-white/[0.4]">
												radius=&#123;18&#125;
											</code>
										</div>
										<div className="flex flex-col items-center gap-2">
											<Avatar seed="studio" size={84} radius={0} />
											<code className="text-[11px] text-white/[0.4]">
												radius=&#123;0&#125;
											</code>
										</div>
									</Preview>
									<CodeBlock
										code={`<GradientAvatar seed="studio" size={84} />            // circle
<GradientAvatar seed="studio" size={84} radius={18} /> // rounded square
<GradientAvatar seed="studio" size={84} radius={0} />  // square`}
									/>
								</Section>

								<Section id="engine" eyebrow="Advanced" title="Engine helpers">
									<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
										The bundled engine is re-exported so you can render
										gradients outside React — to a data URL for an{" "}
										<code>&lt;img&gt;</code>, a Blob for the clipboard, or a
										full-resolution download.
									</p>
									<div className="flex flex-col rounded-[14px] border border-white/[0.06] overflow-hidden">
										{HELPERS.map((h) => (
											<div
												key={h.sig}
												className="flex flex-col gap-1 px-4 py-3 border-b border-white/[0.06] last:border-b-0"
											>
												<code className="text-[13px] font-mono text-white/[0.88]">
													{h.sig}
												</code>
												<span className="text-[13px] text-white/[0.52] leading-5 tracking-[0.14px]">
													{h.desc}
												</span>
											</div>
										))}
									</div>
									<CodeBlock
										label="export.ts"
										code={`import { gradientToDataURL, generatePalette } from "@outpacelabs/avatars";

// A 512×512 PNG data URL, no React required.
const src = gradientToDataURL("jane@example.com", { size: 512 });

// Just the colors behind a seed.
const { colors, harmony } = generatePalette("jane@example.com");`}
									/>
									<p className="text-xs text-white/[0.4] leading-5 tracking-[0.12px]">
										Types are exported too:{" "}
										<code className="text-white/[0.6]">GradientPalette</code>,{" "}
										<code className="text-white/[0.6]">Harmony</code>,{" "}
										<code className="text-white/[0.6]">RenderOptions</code>, and{" "}
										<code className="text-white/[0.6]">ExportOptions</code>.
									</p>
								</Section>

								<Section id="license" eyebrow="Legal" title="License">
									<p className="text-sm text-white/[0.56] leading-6 tracking-[0.14px]">
										Free to use under the{" "}
										<a
											href="https://opensource.org/license/mit"
											target="_blank"
											rel="noopener"
											className="text-white/[0.88] hover:underline"
										>
											MIT license
										</a>{" "}
										— use it anywhere, commercial or not, no attribution
										required.
									</p>
								</Section>
							</div>
						</main>
					</div>
				</section>
			</div>

			{/* FOOTER — same as home */}
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

			<Toast />
		</div>
	);
}
