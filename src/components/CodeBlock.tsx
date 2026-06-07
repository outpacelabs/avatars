"use client";

import posthog from "posthog-js";

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

interface CodeBlockProps {
	code: string;
	/** Shown as a faint label in the top-left (e.g. a filename or "Terminal"). */
	label?: string;
}

/**
 * Monospace code card matching the site's surfaces. The copy button reuses the
 * page's Toast via the shared `show-toast` event.
 */
export function CodeBlock({ code, label }: CodeBlockProps) {
	const copy = () => {
		void navigator.clipboard?.writeText(code).then(() => {
			window.dispatchEvent(new CustomEvent("show-toast"));
			posthog.capture("Docs Code Copied", { snippet_label: label ?? null });
		});
	};

	return (
		<div className="group relative rounded-[14px] bg-white/[0.04] border border-white/[0.06]">
			{label ? (
				<span className="absolute top-3 left-4 text-[11px] font-medium text-white/[0.32] leading-4 tracking-[0.12px]">
					{label}
				</span>
			) : null}

			<button
				type="button"
				onClick={copy}
				title="Copy to clipboard"
				aria-label="Copy code to clipboard"
				className="absolute top-2.5 right-2.5 z-10 p-2 rounded-[7px] text-white/[0.4] opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/[0.88] group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
			>
				<ClipboardIcon />
			</button>

			<pre
				className={`overflow-x-auto px-4 pb-4 text-[13px] font-mono leading-6 text-white/[0.82] ${
					label ? "pt-9" : "pt-4"
				}`}
			>
				<code>{code}</code>
			</pre>
		</div>
	);
}
