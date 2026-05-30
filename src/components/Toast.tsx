"use client";

import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

const MAX_TOASTS = 4;
const TOAST_DURATION = 1400;

interface ToastData {
	id: number;
}

function SingleToast({
	index,
	total,
	onDismiss,
}: {
	index: number;
	total: number;
	onDismiss: () => void;
}) {
	const reducedMotion = usePrefersReducedMotion();

	// Newest toast sits in front; older ones recede up and shrink.
	const depth = total - 1 - index;
	const scale = 1 - depth * 0.05;
	const yOffset = depth * -6;
	const opacity = 1 - depth * 0.2;
	const zIndex = total - depth;

	useEffect(() => {
		const timer = setTimeout(onDismiss, TOAST_DURATION);
		return () => clearTimeout(timer);
	}, [onDismiss]);

	return (
		<motion.div
			style={{ zIndex }}
			initial={
				reducedMotion
					? { opacity, y: yOffset, scale }
					: { opacity: 0, y: 16, scale: scale * 0.95 }
			}
			animate={{ opacity, y: yOffset, scale }}
			exit={{ opacity: 0, y: yOffset + 8 }}
			transition={
				reducedMotion
					? { duration: 0 }
					: { type: "spring", stiffness: 500, damping: 30 }
			}
			className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-[14px] py-2 rounded-full bg-white/[0.12] backdrop-blur-[12px] border border-white/[0.12] whitespace-nowrap"
		>
			<svg
				aria-hidden="true"
				width="14"
				height="14"
				viewBox="0 0 14 14"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="shrink-0"
			>
				<motion.path
					d="M1.60416 8.80469L5.24999 11.8125L12.3958 2.1875"
					stroke="white"
					strokeWidth="1.25"
					strokeLinecap="square"
					initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={
						reducedMotion ? { duration: 0 } : { duration: 0.2, delay: 0.1 }
					}
				/>
			</svg>
			<span className="text-sm font-medium text-white/[0.88] leading-5 tracking-[0.14px]">
				Copied to clipboard
			</span>
		</motion.div>
	);
}

export function Toast() {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const idRef = useRef(0);

	useEffect(() => {
		const handleShowToast = () => {
			const id = idRef.current++;
			setToasts((prev) => [...prev, { id }].slice(-MAX_TOASTS));

			posthog.capture("Toast Displayed", {
				toast_id: id,
				toast_message: "Copied to clipboard",
				total_toasts_active: Math.min(idRef.current, MAX_TOASTS),
			});
		};

		window.addEventListener("show-toast", handleShowToast);
		return () => window.removeEventListener("show-toast", handleShowToast);
	}, []);

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
			<div className="relative h-9">
				<AnimatePresence>
					{toasts.map((toast, index) => (
						<SingleToast
							key={toast.id}
							index={index}
							total={toasts.length}
							onDismiss={() => dismiss(toast.id)}
						/>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}
