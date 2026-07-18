"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
	CHANGELOG,
	type ChangeKind,
	formatChangelogDate,
} from "@/lib/changelog";

/*
 * Changelog styled like the docs: the same thin ~640px reading column, the
 * same ink/body/muted text tokens, borderless rounded surfaces, dark mode.
 * Entries are newest-first; the "next" entry reads as a teaser, not a release.
 */

const INK = "rgba(255,255,255,0.92)";
const BODY = "rgba(255,255,255,0.62)";
const MUTED = "rgba(255,255,255,0.42)";
const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

/* Same in-view reveal as the docs' Col, timing-consistent across pages. */
function Col({ children }: { children: ReactNode }) {
	const reduced = useReducedMotion() ?? false;
	return (
		<motion.div
			style={{ maxWidth: 640, margin: "0 auto" }}
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

const KIND_LABEL: Record<ChangeKind, string> = {
	new: "New",
	improved: "Improved",
	fixed: "Fixed",
};

/* Monochrome kind label, plain uppercase mono text, no pill; the site palette
   is black & white, so kinds are distinguished by the word, not color. A fixed
   width makes it a left column so every row's change text starts at the same x. */
const KIND_COL_WIDTH = 68;
function KindTag({ kind }: { kind: ChangeKind }) {
	return (
		<span
			style={{
				flexShrink: 0,
				width: KIND_COL_WIDTH,
				fontFamily: MONO,
				fontSize: 10,
				lineHeight: "16px",
				letterSpacing: "0.06em",
				textTransform: "uppercase",
				color: MUTED,
				whiteSpace: "nowrap",
				alignSelf: "flex-start",
				marginTop: 3,
			}}
		>
			{KIND_LABEL[kind]}
		</span>
	);
}

export function ChangelogContent() {
	return (
		<div
			style={{
				position: "relative",
				minHeight: "100vh",
				paddingBottom: 96,
				overflowX: "clip",
			}}
		>
			<div className="flex flex-col items-center w-full pt-3 gap-6">
				<section className="w-full px-6 flex flex-col gap-3">
					<SiteHeader />

					{/* Same 1080 container + top padding as the docs, so both pages
					    start the same distance below the header. */}
					<div
						className="pt-14 sm:pt-20"
						style={{
							position: "relative",
							maxWidth: 1080,
							margin: "0 auto",
							width: "100%",
						}}
					>
						<main>
							<Col>
								{/* Headline hidden by design, kept for SEO/accessibility, 
								    same treatment as the docs' H1. */}
								<h1 className="sr-only">Changelog</h1>
							</Col>

							{/* Hide in-progress (undated) entries for now, released only. */}
							{CHANGELOG.filter((entry) => entry.date).map((entry, i) => (
								<section
									key={entry.version}
									id={`v${entry.version}`}
									style={{ scrollMarginTop: 96 }}
								>
									<Col>
										{/* Entry header: version pill + date on one line, then
										    the title at the docs' H2 scale. The first entry sits
										    flush under the header padding (like the docs' first
										    section); later entries get the 72px separation. */}
										<div
											style={{
												display: "flex",
												alignItems: "baseline",
												gap: 12,
												margin: i === 0 ? 0 : "72px 0 0",
											}}
										>
											<span
												style={{
													fontFamily: MONO,
													fontSize: 12,
													lineHeight: "20px",
													color: INK,
												}}
											>
												{entry.version === "next"
													? "Up next"
													: `v${entry.version}`}
											</span>
											<span
												style={{
													fontSize: 13,
													color: MUTED,
													letterSpacing: "0.1px",
												}}
											>
												{entry.date
													? formatChangelogDate(entry.date)
													: "In progress"}
											</span>
										</div>
										<h2
											style={{
												fontSize: 15,
												fontWeight: 450,
												color: INK,
												letterSpacing: "-0.1px",
												margin: "16px 0 0",
												textWrap: "balance",
											}}
										>
											{entry.title}
										</h2>
										<p
											style={{
												fontSize: 14,
												lineHeight: 1.72,
												letterSpacing: "0.1px",
												color: BODY,
												margin: "8px 0 0",
												textWrap: "pretty",
											}}
										>
											{entry.summary}
										</p>

										{/* Changes on a flat rounded surface, one row each, 
										    the docs' props-table treatment. */}
										<div
											style={{
												margin: "18px 0 0",
												borderRadius: 16,
												overflow: "hidden",
												background: "rgba(255,255,255,0.04)",
											}}
										>
											{entry.changes.map((change, i) => (
												<div
													key={change.text}
													style={{
														display: "flex",
														gap: 12,
														padding: "12px 16px",
														borderTop:
															i === 0
																? undefined
																: "1px solid rgba(255,255,255,0.06)",
													}}
												>
													<KindTag kind={change.kind} />
													<span
														style={{
															flex: 1,
															fontSize: 13,
															color: BODY,
															lineHeight: 1.6,
														}}
													>
														{change.text}
													</span>
												</div>
											))}
										</div>
									</Col>
								</section>
							))}
						</main>
					</div>
				</section>
			</div>

			<SiteFooter />
		</div>
	);
}
