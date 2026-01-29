"use client";

import gsap from "gsap";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_TOASTS = 4;

interface ToastData {
	id: number;
}

function SingleToast({
	index,
	total,
	isNewest,
	onAnimationComplete,
}: {
	index: number;
	total: number;
	isNewest: boolean;
	onAnimationComplete?: () => void;
}) {
	const toastRef = useRef<HTMLDivElement>(null);
	const checkRef = useRef<SVGPathElement>(null);
	const hasAnimatedIn = useRef(false);

	const depth = total - 1 - index;
	const scale = 1 - depth * 0.05;
	const yOffset = depth * -6;
	const opacity = 1 - depth * 0.2;
	const zIndex = total - depth;

	useEffect(() => {
		if (!toastRef.current || !checkRef.current) return;

		const toast = toastRef.current;
		const check = checkRef.current;

		if (isNewest && !hasAnimatedIn.current) {
			// Animate in the newest toast
			hasAnimatedIn.current = true;
			gsap.set(check, { strokeDashoffset: 18 });

			gsap.fromTo(
				toast,
				{ opacity: 0, y: 16, scale: scale * 0.95 },
				{ opacity, y: yOffset, scale, duration: 0.25, ease: "back.out(2)" },
			);

			gsap.to(check, {
				strokeDashoffset: 0,
				duration: 0.2,
				delay: 0.1,
				ease: "power2.out",
			});
		} else if (hasAnimatedIn.current) {
			// Animate existing toasts to new position
			gsap.to(toast, {
				y: yOffset,
				scale,
				opacity,
				duration: 0.2,
				ease: "power2.out",
			});
		}
	}, [isNewest, scale, yOffset, opacity]);

	useEffect(() => {
		if (!toastRef.current || index !== 0) return;

		// Only the oldest toast (index 0) handles exit
		const timer = setTimeout(() => {
			if (toastRef.current) {
				gsap.to(toastRef.current, {
					opacity: 0,
					y: yOffset + 8,
					duration: 0.2,
					ease: "power2.in",
					onComplete: onAnimationComplete,
				});
			}
		}, 1400);

		return () => clearTimeout(timer);
	}, [index, yOffset, onAnimationComplete]);

	return (
		<div
			ref={toastRef}
			className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-[14px] py-2 rounded-full bg-white/[0.12] backdrop-blur-[12px] border border-white/[0.12] whitespace-nowrap"
			style={{
				zIndex,
				opacity: 0,
				boxShadow:
					"0 3px 6px rgba(10, 10, 10, 0.06), 0 11px 11px rgba(10, 10, 10, 0.05), 0 25px 15px rgba(10, 10, 10, 0.03), 0 44px 18px rgba(10, 10, 10, 0.01)",
			}}
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
				<path
					ref={checkRef}
					d="M1.60416 8.80469L5.24999 11.8125L12.3958 2.1875"
					stroke="white"
					strokeWidth="1.25"
					strokeLinecap="square"
					strokeDasharray="18"
					strokeDashoffset="18"
				/>
			</svg>
			<span className="text-sm font-medium text-white/[0.88] leading-5 tracking-[0.14px]">
				Copied to clipboard
			</span>
		</div>
	);
}

export function Toast() {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const idRef = useRef(0);

	useEffect(() => {
		const handleShowToast = () => {
			const id = idRef.current++;
			setToasts((prev) => {
				const updated = [...prev, { id }];
				return updated.slice(-MAX_TOASTS);
			});

			// Track toast display
			posthog.capture("Toast Displayed", {
				toast_id: id,
				toast_message: "Copied to clipboard",
				total_toasts_active: Math.min(idRef.current, MAX_TOASTS),
			});
		};

		window.addEventListener("show-toast", handleShowToast);
		return () => window.removeEventListener("show-toast", handleShowToast);
	}, []);

	const handleRemoveOldest = useCallback(() => {
		setToasts((prev) => prev.slice(1));
	}, []);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
			<div className="relative h-9">
				{toasts.map((toast, index) => (
					<SingleToast
						key={toast.id}
						index={index}
						total={toasts.length}
						isNewest={index === toasts.length - 1}
						onAnimationComplete={index === 0 ? handleRemoveOldest : undefined}
					/>
				))}
			</div>
		</div>
	);
}
