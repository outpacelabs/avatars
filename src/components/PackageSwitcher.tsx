"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
const INK = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.42)";
const BORDER = "rgba(255,255,255,0.08)";

// Indicator slides share one spring across the docs (TOC dot uses the same),
// per timing-consistent: similar elements use identical timing.
const SLIDE_SPRING = { type: "spring", stiffness: 520, damping: 34 } as const;
// Icon morph wants a touch of overshoot-and-settle (physics-spring-for-overshoot).
const MORPH_SPRING = { type: "spring", stiffness: 600, damping: 26 } as const;

/**
 * Copy → check icon morph. Both glyphs live in one 16×16 box and cross-fade
 * with a scale + rotate spring so the check appears to grow out of the
 * clipboard; the check also draws itself in via pathLength. Applies the wiki
 * morphing rules: shared viewBox, spring physics, round caps, aria-hidden,
 * reduced-motion fallback, and exit mirroring initial.
 */
function CopyMorphIcon({ copied }: { copied: boolean }) {
	const reduced = useReducedMotion() ?? false;
	const spring = reduced ? { duration: 0 } : MORPH_SPRING;

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
						style={{ position: "absolute", color: MUTED }}
						initial={{ opacity: 0, scale: 0.5, rotate: reduced ? 0 : -35 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.5, rotate: reduced ? 0 : 35 }}
						transition={spring}
					>
						<motion.path
							d="M3.5 8.4 6.6 11.5 12.5 4.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							initial={{ pathLength: reduced ? 1 : 0 }}
							animate={{ pathLength: 1 }}
							transition={reduced ? { duration: 0 } : { duration: 0.22 }}
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
						style={{ position: "absolute", color: MUTED }}
						initial={{ opacity: 0, scale: 0.5, rotate: reduced ? 0 : -35 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.5, rotate: reduced ? 0 : 35 }}
						transition={spring}
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

/**
 * shadcn-style package-manager switcher: a tab per manager and a copy button,
 * over the highlighted command. The active-tab fill is one shared element that
 * glides between tabs (layoutId), the command body blurs in on switch, and the
 * copy icon morphs to a check — all via framer-motion.
 */
export function PackageSwitcher({
	items,
}: {
	items: { id: string; command: string; html: string }[];
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
					padding: "8px 10px 8px 12px",
					borderBottom: `1px solid ${BORDER}`,
				}}
			>
				<style>{`.pkg-tab{outline:none}.pkg-tab:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,0.22)}`}</style>
				{items.map((it, i) => {
					const isActive = i === active;
					return (
						<button
							key={it.id}
							type="button"
							className="pkg-tab"
							onClick={() => setActive(i)}
							style={{
								position: "relative",
								fontFamily: MONO,
								fontSize: 13,
								lineHeight: 1,
								padding: "5px 9px",
								borderRadius: 7,
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
										borderRadius: 7,
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
					className="pkg-tab"
					onClick={copy}
					title="Copy to clipboard"
					aria-label="Copy install command"
					style={{
						marginLeft: "auto",
						display: "grid",
						placeItems: "center",
						padding: 7,
						borderRadius: 7,
						border: 0,
						background: "transparent",
						cursor: "pointer",
					}}
				>
					<CopyMorphIcon copied={copied} />
				</button>
			</div>
			{/* Command body blurs in on switch. mode="wait" doubles duration, so
			    each leg stays short (easing-for-state-change, sub-300ms total). */}
			<div style={{ position: "relative" }}>
				<AnimatePresence initial={false} mode="wait">
					<motion.div
						key={cur.id}
						className="docs-code"
						initial={{ opacity: 0, filter: reduced ? "none" : "blur(6px)" }}
						animate={{ opacity: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, filter: reduced ? "none" : "blur(6px)" }}
						transition={
							reduced ? { duration: 0 } : { duration: 0.13, ease: "easeOut" }
						}
						dangerouslySetInnerHTML={{ __html: cur.html }}
					/>
				</AnimatePresence>
			</div>
		</div>
	);
}
