"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
const INK = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.42)";

// Indicator slides share one spring across the docs (TOC dot uses the same),
// per timing-consistent: similar elements use identical timing.
const SLIDE_SPRING = { type: "spring", stiffness: 520, damping: 34 } as const;
// Confirming a copy is a quiet state change, not a celebration — a calm
// ease with no overshoot (easing-for-state-change), kept under 300ms.
const MORPH_EASE = { duration: 0.16, ease: "easeOut" } as const;

/**
 * Copy → check icon morph. Both glyphs live in one 16×16 box and cross-fade
 * with a subtle scale so the check settles in over the clipboard, the check
 * drawing itself in via pathLength. Applies the wiki morphing rules: shared
 * viewBox, round caps, aria-hidden, reduced-motion fallback, exit mirrors
 * initial — restrained, no rotation or bounce.
 */
function CopyMorphIcon({ copied }: { copied: boolean }) {
	const reduced = useReducedMotion() ?? false;
	const t = reduced ? { duration: 0 } : MORPH_EASE;

	return (
		<span
			aria-hidden="true"
			style={{
				position: "relative",
				width: 15,
				height: 15,
				display: "grid",
				placeItems: "center",
			}}
		>
			<AnimatePresence initial={false} mode="popLayout">
				{copied ? (
					<motion.svg
						key="check"
						aria-hidden="true"
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						style={{ position: "absolute", color: INK }}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={t}
					>
						<motion.path
							d="M3.5 8.4 6.6 11.5 12.5 4.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							initial={{ pathLength: reduced ? 1 : 0 }}
							animate={{ pathLength: 1 }}
							transition={
								reduced ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }
							}
						/>
					</motion.svg>
				) : (
					<motion.svg
						key="copy"
						aria-hidden="true"
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						style={{ position: "absolute", color: "currentColor" }}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={t}
					>
						<path
							d="M10.1667 3.16634H12.8334V14.1663H3.16675V3.16634H5.83341M5.83341 1.83301H10.1667V4.83301H5.83341V1.83301Z"
							stroke="currentColor"
							strokeWidth="1.25"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</motion.svg>
				)}
			</AnimatePresence>
		</span>
	);
}

// github-dark-ish colors for the command's three segments: manager, sub, pkg.
const TOKEN_COLORS = ["#d2a8ff", "#79c0ff", "#a5d6ff"];
const GLYPHS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@/._-";

type Cell = { ch: string; color: string };

/** Split `pnpm add @outpacelabs/avatars` into colored character cells. */
function toCells(command: string): Cell[] {
	const cells: Cell[] = [];
	const parts = command.split(" ");
	parts.forEach((part, pi) => {
		const color = TOKEN_COLORS[Math.min(pi, TOKEN_COLORS.length - 1)];
		for (const ch of part) cells.push({ ch, color });
		if (pi < parts.length - 1) cells.push({ ch: " ", color: INK });
	});
	return cells;
}

/**
 * The command line, "decoded" into place on switch: each glyph cycles through
 * random characters then locks to its target, staggered left-to-right. The
 * resting state is the plain command (correct on the server, no scramble on
 * first mount); reduced motion sets it instantly.
 */
function ScrambleCommand({ command }: { command: string }) {
	const reduced = useReducedMotion() ?? false;
	const target = toCells(command);
	// While animating, `scramble` holds the in-flight glyphs; otherwise null and
	// we render `target` directly (correct on the server, no first-mount jump).
	const [scramble, setScramble] = useState<Cell[] | null>(null);
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
		const next = toCells(command);
		// PER×chars + DUR ≈ 285ms for the longest command — the whole decode
		// settles inside the 300ms ceiling (timing-under-300ms).
		const PER = 6; // ms of stagger per character
		const DUR = 130; // ms each character spends scrambling
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const elapsed = now - start;
			let settled = true;
			const frame = next.map((cell, i) => {
				if (cell.ch === " " || elapsed >= i * PER + DUR) return cell;
				settled = false;
				return {
					ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
					color: cell.color,
				};
			});
			setScramble(settled ? null : frame);
			if (!settled) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [command, reduced]);

	const cells = scramble ?? target;

	return (
		<pre
			style={{
				margin: 0,
				padding: "16px 18px",
				overflowX: "auto",
				lineHeight: 1.65,
				fontFamily: MONO,
				fontSize: 13,
			}}
		>
			<code>
				{cells.map((cell, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: positional glyph cells
					<span key={i} style={{ color: cell.color, whiteSpace: "pre" }}>
						{cell.ch}
					</span>
				))}
			</code>
		</pre>
	);
}

/**
 * shadcn-style package-manager switcher: a tab per manager and a copy button,
 * over the install command. The active-tab fill is one shared element that
 * glides between tabs (layoutId), the command decodes into place on switch
 * (scramble), and the copy icon morphs to a check — all via framer-motion.
 */
export function PackageSwitcher({
	items,
}: {
	items: { id: string; command: string }[];
}) {
	const [active, setActive] = useState(0);
	const [copied, setCopied] = useState(false);
	const reduced = useReducedMotion() ?? false;
	const cur = items[active];

	const copy = () => {
		void navigator.clipboard?.writeText(cur.command).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		});
	};

	return (
		<div
			style={{
				margin: "22px 0 0",
				borderRadius: 16,
				overflow: "hidden",
				background: "rgba(255,255,255,0.04)",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 2,
					// Borderless: tabs float over the shared surface. Equal top/left
					// inset to the active pill; left also lands the tab labels on the
					// command text below (13 + the tab's own 5px = shiki's 18px).
					padding: "13px 13px 5px 13px",
				}}
			>
				<style>{`
					.pkg-tab{outline:none}
					.pkg-tab:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,0.22)}
					.pkg-mgr:not(.is-active):hover{color:rgba(255,255,255,0.74) !important}
					.pkg-copy{color:rgba(255,255,255,0.42);transition:color 150ms ease}
					.pkg-copy:hover{color:rgba(255,255,255,0.92)}
				`}</style>
				{items.map((it, i) => {
					const isActive = i === active;
					return (
						<button
							key={it.id}
							type="button"
							className={`pkg-tab pkg-mgr${isActive ? " is-active" : ""}`}
							onClick={() => setActive(i)}
							style={{
								position: "relative",
								fontFamily: MONO,
								// Clone the inline-code chip exactly: same text size (it renders
								// 11.76px there) and same box — lineHeight matched to the font's
								// content area (~1.28) so the chip is 21px with 3/5 padding.
								fontSize: 11.76,
								lineHeight: 1.28,
								padding: "3px 5px",
								borderRadius: 6,
								border: 0,
								background: "transparent",
								color: isActive ? INK : MUTED,
								cursor: "pointer",
								transition: "color 150ms ease",
							}}
						>
							{isActive && (
								<motion.span
									aria-hidden="true"
									layoutId="pkg-tab-active"
									transition={reduced ? { duration: 0 } : SLIDE_SPRING}
									style={{
										position: "absolute",
										inset: 0,
										borderRadius: 6,
										background: "rgba(255,255,255,0.05)",
										zIndex: 0,
									}}
								/>
							)}
							<span style={{ position: "relative", zIndex: 1 }}>{it.id}</span>
						</button>
					);
				})}
				<button
					type="button"
					className="pkg-tab pkg-copy"
					onClick={copy}
					title="Copy to clipboard"
					aria-label="Copy install command"
					style={{
						marginLeft: "auto",
						display: "grid",
						placeItems: "center",
						// Match the tab height (15px icon + 2px = 19px) so flex-centering
						// doesn't push the tabs down — keeps the pill's top inset == left.
						padding: "2px 7px",
						borderRadius: 7,
						border: 0,
						background: "transparent",
						cursor: "pointer",
					}}
				>
					<CopyMorphIcon copied={copied} />
				</button>
			</div>
			<ScrambleCommand command={cur.command} />
		</div>
	);
}
