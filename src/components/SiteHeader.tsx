"use client";

import posthog from "posthog-js";

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
			fillOpacity="0.88"
		/>
		<path
			d="M16.5 0H29.9062C31.6149 0 33 1.34315 33 3C33 4.65685 31.6149 6 29.9062 6H22.6875C19.2702 6 16.5 3.31371 16.5 0Z"
			fill="white"
			fillOpacity="0.88"
		/>
		<path
			d="M24.75 12C26.4586 12 27.8437 10.6569 27.8437 9C27.8437 7.34315 26.4586 6 24.75 6H22.6875C19.2702 6 16.5 8.68629 16.5 12H24.75Z"
			fill="white"
			fillOpacity="0.88"
		/>
	</svg>
);

/**
 * Sticky page header shared by the index and generate pages.
 * `position: sticky` only works when no ancestor establishes a scroll
 * container — keep page roots free of `overflow-x: hidden` (use `clip`).
 */
export function SiteHeader() {
	return (
		<header className="sticky top-4 z-10 flex items-center justify-between w-full rounded-[10px] px-4 md:px-5 py-3">
			<p className="text-sm font-semibold text-white/[0.88] leading-5 tracking-[0.14px]">
				Avatars
			</p>
			<p className="text-sm font-semibold text-white/[0.88] leading-5 tracking-[0.14px]">
				by{" "}
				<a
					href="https://outpacestudios.com"
					target="_blank"
					onClick={() =>
						posthog.capture("External Link Clicked", {
							link_url: "https://outpacestudios.com",
							link_location: "header",
							link_text: "Outpace Studios",
						})
					}
					rel="noopener"
				>
					Outpace Studios
				</a>
			</p>
		</header>
	);
}
