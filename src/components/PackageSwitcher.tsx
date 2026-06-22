"use client";

import { useState } from "react";

const MONO =
	"var(--font-geist-mono), ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";
const INK = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.42)";
const BORDER = "rgba(255,255,255,0.08)";

const ClipboardIcon = () => (
	<svg
		aria-hidden="true"
		width="15"
		height="15"
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

const CheckIcon = () => (
	<svg
		aria-hidden="true"
		width="15"
		height="15"
		viewBox="0 0 14 14"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M1.6 7.4 5.2 10.8 12.4 2.2"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

/**
 * shadcn-style package-manager switcher: a header with a terminal icon, a tab
 * per manager, and a copy button, over the highlighted command. The command
 * HTML is pre-highlighted on the server (one per manager).
 */
export function PackageSwitcher({
	items,
}: {
	items: { id: string; command: string; html: string }[];
}) {
	const [active, setActive] = useState(0);
	const [copied, setCopied] = useState(false);
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
				{items.map((it, i) => (
					<button
						key={it.id}
						type="button"
						onClick={() => setActive(i)}
						style={{
							fontFamily: MONO,
							fontSize: 13,
							lineHeight: 1,
							padding: "5px 9px",
							borderRadius: 7,
							border: 0,
							background:
								i === active ? "rgba(255,255,255,0.05)" : "transparent",
							color: i === active ? INK : MUTED,
							cursor: "pointer",
							transition: "color 150ms ease, background 150ms ease",
						}}
					>
						{it.id}
					</button>
				))}
				<button
					type="button"
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
						color: copied ? "#6ee7a8" : MUTED,
						cursor: "pointer",
						transition: "color 150ms ease",
					}}
				>
					{copied ? <CheckIcon /> : <ClipboardIcon />}
				</button>
			</div>
			{/* docs-code → picks up the shared .shiki style (transparent bg, mono) */}
			<div
				className="docs-code"
				dangerouslySetInnerHTML={{ __html: cur.html }}
			/>
		</div>
	);
}
