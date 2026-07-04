"use client";

import {
	close as closeSound,
	open as openSound,
	tap as tapSound,
	turn as turnSound,
} from "@outpacelabs/audio";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

export const OutpaceLogo = () => (
	<svg
		aria-hidden="true"
		width="33"
		height="12"
		viewBox="0 0 33 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M16.5 6C16.5 2.68629 13.7298 0 10.3125 0H6.1875C2.77024 0 0 2.68629 0 6C0 9.31371 2.77024 12 6.1875 12H10.3125C13.7298 12 16.5 9.31371 16.5 6Z"
			fill="white"
			fillOpacity="0.96"
		/>
		<path
			d="M16.5 0H29.9062C31.6149 0 33 1.34315 33 3C33 4.65685 31.6149 6 29.9062 6H22.6875C19.2702 6 16.5 3.31371 16.5 0Z"
			fill="white"
			fillOpacity="0.96"
		/>
		<path
			d="M24.75 12C26.4586 12 27.8437 10.6569 27.8437 9C27.8437 7.34315 26.4586 6 24.75 6H22.6875C19.2702 6 16.5 8.68629 16.5 12H24.75Z"
			fill="white"
			fillOpacity="0.96"
		/>
	</svg>
);

const GithubMark = () => (
	<svg
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		className="block shrink-0"
	>
		<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
	</svg>
);

/* ── the "More" switcher: the sibling labs sites, favicon and all. Each row
      loads the live /icon.png straight from the sibling, so there is nothing
      to copy around when a favicon changes. Dark frosted panel to match the
      header's white-on-glass pills. Hidden for now — flip to re-enable. ── */
const SHOW_MORE_MENU = false;
const LABS = [
	{ name: "avatars", href: "https://avatars.outpacestudios.com" },
	{ name: "smooth", href: "https://smooth.outpacestudios.com" },
	{ name: "audio", href: "https://audio.outpacestudios.com" },
];
const CURRENT_LAB = "avatars";
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function LabsMenu() {
	const [menuOpen, setMenuOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onDown = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) {
				closeSound();
				setMenuOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeSound();
				setMenuOpen(false);
			}
		};
		window.addEventListener("pointerdown", onDown);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("pointerdown", onDown);
			window.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label="More Outpace Labs projects"
				onClick={() => {
					if (menuOpen) closeSound();
					else openSound();
					setMenuOpen(!menuOpen);
				}}
				className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] py-2.5 pl-3.5 pr-3 text-sm font-[550] leading-none text-white/[0.96] transition hover:bg-white/[0.12] motion-safe:active:scale-[0.97]"
			>
				More
				<ChevronDownIcon
					aria-hidden="true"
					width={13}
					height={13}
					className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{menuOpen && (
				<motion.div
					role="menu"
					initial={{ opacity: 0, y: -4, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.16, ease: EASE_OUT }}
					className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-[12px] bg-white/[0.08] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
				>
					{LABS.map((site) => (
						<a
							key={site.name}
							role="menuitem"
							href={site.href}
							aria-current={site.name === CURRENT_LAB ? "page" : undefined}
							onClick={() => tapSound()}
							className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-[550] leading-none text-white/[0.96] transition-colors hover:bg-white/[0.12]"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`${site.href}/icon.png`}
								alt=""
								width={16}
								height={16}
								className="rounded-[4px]"
							/>
							{site.name}
							{site.name === CURRENT_LAB && (
								<span className="ml-auto text-[11px] text-white/[0.4]">
									current
								</span>
							)}
						</a>
					))}
				</motion.div>
			)}
		</div>
	);
}

// Glass nav type: 14px / weight 550 / rgba(255,255,255,0.96), no letter-spacing.
const navLink = (active: boolean) =>
	`text-sm font-[550] leading-5 transition-colors ${
		active ? "text-white/[0.96]" : "text-white/[0.48] hover:text-white/[0.96]"
	}`;

/**
 * Sticky page header shared by the index and docs pages.
 * `position: sticky` only works when no ancestor establishes a scroll
 * container — keep page roots free of `overflow-x: hidden` (use `clip`).
 *
 * No horizontal padding of its own: the wrapping section's px-6 (24px)
 * already renders glass's exact horizontal inset, and top-4 (16px) the
 * vertical one.
 */
export function SiteHeader() {
	const pathname = usePathname();
	const onDocs = pathname?.startsWith("/docs");
	const onHome = !onDocs;

	return (
		<header className="sticky top-4 z-10 relative flex items-center justify-between w-full rounded-[10px] py-0">
			{/* Brand mark, left — doubles as the home link. */}
			<Link
				href="/"
				aria-label="Avatars, home"
				className="flex items-center transition-opacity hover:opacity-80"
			>
				<OutpaceLogo />
			</Link>
			{/* Nav links, centered in the bar. */}
			<nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-5">
				<Link
					href="/"
					aria-current={onHome ? "page" : undefined}
					onClick={() => {
						if (!onHome) turnSound("back");
					}}
					className={navLink(onHome)}
				>
					Home
				</Link>
				<Link
					href="/docs"
					aria-current={onDocs ? "page" : undefined}
					onClick={() => {
						if (!onDocs) turnSound("forward");
					}}
					className={navLink(onDocs)}
				>
					Docs
				</Link>
			</nav>
			{/* GitHub pill + More switcher, right — glass's frosted-pill style.
			    Glass ships a disabled "Soon" placeholder (their repo isn't
			    public); ours links to the live public repo. */}
			<div className="flex items-center gap-2">
				<a
					href="https://github.com/outpacelabs/avatars"
					target="_blank"
					rel="noopener"
					aria-label="GitHub repository"
					onClick={() => {
						tapSound();
						posthog.capture("External Link Clicked", {
							link_url: "https://github.com/outpacelabs/avatars",
							link_location: "header",
							link_text: "GitHub",
						});
					}}
					className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] py-2.5 pl-3 pr-3.5 text-sm font-[550] leading-none text-white/[0.96] transition hover:bg-white/[0.12] motion-safe:active:scale-[0.97]"
				>
					<GithubMark />
					GitHub
				</a>
				{SHOW_MORE_MENU && <LabsMenu />}
			</div>
		</header>
	);
}
