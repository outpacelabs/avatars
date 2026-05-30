"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";
import { IconButton } from "./IconButton";

interface AvatarCardProps {
	id: number;
	index: number;
	previewSrc: string;
	fullSrc: string;
}

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

const DownloadIcon = () => (
	<svg
		aria-hidden="true"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M13.5 9.83333V13.5H2.5V9.83333M7.99999 2.5L8 9.33333M5.66667 7.66667L7.99999 10L10.3333 7.66667"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
		/>
	</svg>
);

export function AvatarCard({
	id,
	index,
	previewSrc,
	fullSrc,
}: AvatarCardProps) {
	const [supportsClipboard, setSupportsClipboard] = useState(false);
	const [hovered, setHovered] = useState(false);
	const reducedMotion = usePrefersReducedMotion();

	// Check if device supports clipboard write for images (client-side only)
	useEffect(() => {
		const supported =
			"clipboard" in navigator &&
			"write" in navigator.clipboard &&
			!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		queueMicrotask(() => setSupportsClipboard(supported));
	}, []);

	const handleCopyToClipboard = async () => {
		// Show toast immediately for instant feedback
		window.dispatchEvent(new CustomEvent("show-toast"));

		try {
			// Use ClipboardItem with a Promise to maintain user gesture context
			const clipboardItem = new ClipboardItem({
				"image/png": (async () => {
					const response = await fetch(fullSrc);
					const blob = await response.blob();

					// Convert to PNG as clipboard only supports PNG
					const img = document.createElement("img");
					img.src = URL.createObjectURL(blob);
					await new Promise((resolve) => {
						img.onload = resolve;
					});

					const canvas = document.createElement("canvas");
					canvas.width = img.width;
					canvas.height = img.height;
					const ctx = canvas.getContext("2d");
					ctx?.drawImage(img, 0, 0);

					URL.revokeObjectURL(img.src);

					return new Promise<Blob>((resolve) => {
						canvas.toBlob((b) => {
							if (b) resolve(b);
						}, "image/png");
					});
				})(),
			});

			await navigator.clipboard.write([clipboardItem]);

			// Track successful clipboard copy
			posthog.capture("Avatar Copied to Clipboard", {
				avatar_id: id,
				avatar_src: fullSrc,
			});
		} catch (err) {
			console.error("Failed to copy image:", err);

			// Track clipboard copy failure with error tracking
			posthog.capture("Avatar Copy Failed", {
				avatar_id: id,
				avatar_src: fullSrc,
				error_message: err instanceof Error ? err.message : String(err),
			});
			posthog.captureException(err);
		}
	};

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = fullSrc;
		link.download = `avatar-${id.toString().padStart(3, "0")}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Track avatar download
		posthog.capture("Avatar Downloaded", {
			avatar_id: id,
			avatar_src: fullSrc,
			file_name: `avatar-${id.toString().padStart(3, "0")}.jpg`,
		});
	};

	const handleEnter = () => {
		setHovered(true);
		posthog.capture("Avatar Hovered", { avatar_id: id });
	};

	const handleDownloadClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		handleDownload();
	};

	return (
		<motion.div
			role={supportsClipboard ? "button" : undefined}
			tabIndex={supportsClipboard ? 0 : undefined}
			className="relative flex aspect-square items-center justify-center rounded-[20px] bg-white/[0.04] cursor-pointer"
			initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: 0.3,
				delay: index * 0.03,
				ease: [0.22, 1, 0.36, 1],
			}}
			whileTap={reducedMotion ? undefined : { scale: 0.98 }}
			onMouseEnter={handleEnter}
			onMouseLeave={() => setHovered(false)}
			onFocus={handleEnter}
			onBlur={() => setHovered(false)}
			onClick={supportsClipboard ? handleCopyToClipboard : undefined}
			onKeyDown={
				supportsClipboard
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleCopyToClipboard();
							}
						}
					: undefined
			}
		>
			<motion.div
				className="relative size-[88px] md:size-[96px] rounded-full overflow-hidden"
				animate={{ scale: hovered && !reducedMotion ? 1.05 : 1 }}
				transition={{ duration: 0.18, ease: "easeOut" }}
			>
				<Image
					src={previewSrc}
					alt={`Avatar ${id.toString().padStart(3, "0")}`}
					fill
					sizes="96px"
					loading={index < 10 ? "eager" : "lazy"}
					className="object-cover"
				/>
			</motion.div>

			<span className="absolute top-4 left-4 md:top-5 md:left-5 text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
				{id.toString().padStart(3, "0")}
			</span>

			<motion.div
				className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex gap-1 items-center"
				initial={false}
				animate={
					hovered
						? { opacity: 1, y: 0, filter: "blur(0px)" }
						: { opacity: 0, y: 8, filter: "blur(4px)" }
				}
				transition={{ duration: 0.18, ease: "easeOut" }}
			>
				{supportsClipboard && (
					<IconButton
						onClick={(e) => {
							e.stopPropagation();
							handleCopyToClipboard();
						}}
						title="Copy to clipboard"
					>
						<ClipboardIcon />
					</IconButton>
				)}
				<IconButton onClick={handleDownloadClick} title="Download">
					<DownloadIcon />
				</IconButton>
			</motion.div>
		</motion.div>
	);
}
