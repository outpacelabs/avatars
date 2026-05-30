"use client";

import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { AvatarCard } from "@/components/AvatarCard";
import { OutpaceLogo, SiteHeader } from "@/components/SiteHeader";
import { Toast } from "@/components/Toast";

const avatars = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	previewSrc: `/avatars/previews/avatar-${i + 1}.webp`,
	fullSrc: `/avatars/avatar-${i + 1}.jpg`,
}));

export default function Home() {
	const [showTopBlur, setShowTopBlur] = useState(false);
	const [showBottomBlur, setShowBottomBlur] = useState(true);
	const hasTrackedScrollToBottom = useRef(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = window.innerHeight;
			const scrollBottom = scrollHeight - scrollTop - clientHeight;

			setShowTopBlur(scrollTop > 50);
			setShowBottomBlur(scrollBottom > 50);

			// Track when user scrolls to bottom (within 50px threshold)
			if (scrollBottom <= 50 && !hasTrackedScrollToBottom.current) {
				hasTrackedScrollToBottom.current = true;
				posthog.capture("Page Scrolled to Bottom", {
					scroll_depth_percentage: 100,
					total_avatars: 50,
				});
			}
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div className="relative flex flex-col gap-12 items-center pb-10 min-h-screen">
			{/* Top gradient */}
			<div
				className={`fixed top-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
					showTopBlur ? "opacity-100" : "opacity-0"
				}`}
				style={{
					background:
						"linear-gradient(to bottom, #0A0A0A 0%, transparent 100%)",
				}}
			/>

			{/* Bottom gradient */}
			<div
				className={`fixed bottom-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
					showBottomBlur ? "opacity-100" : "opacity-0"
				}`}
				style={{
					background: "linear-gradient(to top, #0A0A0A 0%, transparent 100%)",
				}}
			/>

			<div className="flex flex-col gap-6 items-center w-full pt-10">
				<OutpaceLogo />

				<div className="flex flex-col gap-3 w-full px-4">
					<SiteHeader />

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
						{avatars.map((avatar, index) => (
							<AvatarCard
								key={avatar.id}
								id={avatar.id}
								index={index}
								previewSrc={avatar.previewSrc}
								fullSrc={avatar.fullSrc}
							/>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-10 items-center text-center">
				<div className="flex flex-col gap-1.5 items-center text-sm leading-5 tracking-[0.14px]">
					<p className="font-medium text-white/[0.48]">Handcrafted by</p>
					<a
						href="https://outpacestudios.com"
						target="_blank"
						className="font-semibold text-white/[0.88]"
						onClick={() =>
							posthog.capture("External Link Clicked", {
								link_url: "https://outpacestudios.com",
								link_location: "footer",
								link_text: "Outpace Studios",
							})
						}
						rel="noopener"
					>
						Outpace Studios
					</a>
				</div>
				<p className="text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
					Free to use, licensed under{" "}
					<a
						href="https://creativecommons.org/licenses/by/4.0/"
						target="_blank"
						onClick={() =>
							posthog.capture("License Link Clicked", {
								link_url: "https://creativecommons.org/licenses/by/4.0/",
								license_type: "CC BY 4.0",
							})
						}
						rel="noopener"
					>
						CC BY 4.0
					</a>
					.
				</p>
			</div>

			<Toast />
		</div>
	);
}
