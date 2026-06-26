"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

/**
 * Ambient grayscale mesh behind the hero — the avatar engine's radial-spot
 * mesh technique (overlapping soft radial gradients), but animated: each spot
 * slowly orbits its base position so the gradient drifts. Grayscale + heavily
 * blurred for a subtle, moving backdrop. Static for reduced motion.
 */

const RES_W = 640;
const RES_H = 360;
const SPOTS = 6;

type Spot = {
	baseX: number;
	baseY: number;
	orbit: number;
	speed: number;
	phase: number;
	radius: number;
	gray: number;
};

function makeSpots(): Spot[] {
	return Array.from({ length: SPOTS }, (_, i) => {
		const a = (i / SPOTS) * Math.PI * 2;
		return {
			baseX: 0.5 + Math.cos(a) * 0.26,
			baseY: 0.5 + Math.sin(a * 1.3) * 0.22,
			orbit: 0.09 + (i % 3) * 0.035,
			// slow, varied — an ambient drift, not a busy loop
			speed: 0.018 + (i % 4) * 0.01,
			phase: a * 1.7,
			radius: 0.42 + (i % 3) * 0.12,
			gray: 30 + (i % 4) * 13, // 30–69: dark greys on black
		};
	});
}

export function HeroShader() {
	const ref = useRef<HTMLCanvasElement>(null);
	const reduced = usePrefersReducedMotion();

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const spots = makeSpots();
		let raf = 0;

		const frame = (tMs: number) => {
			const t = tMs / 1000;
			ctx.clearRect(0, 0, RES_W, RES_H);
			for (const sp of spots) {
				const w = t * sp.speed * Math.PI * 2 + sp.phase;
				const x = (sp.baseX + Math.cos(w) * sp.orbit) * RES_W;
				const y = (sp.baseY + Math.sin(w) * sp.orbit) * RES_H;
				const r = sp.radius * RES_W;
				const g = ctx.createRadialGradient(x, y, 0, x, y, r);
				const c = sp.gray;
				g.addColorStop(0, `rgba(${c},${c},${c},0.9)`);
				g.addColorStop(0.45, `rgba(${c},${c},${c},0.45)`);
				g.addColorStop(1, `rgba(${c},${c},${c},0)`);
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, RES_W, RES_H);
			}
			if (!reduced) raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [reduced]);

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden"
			style={{
				maskImage:
					"radial-gradient(120% 90% at 50% 30%, black 30%, transparent 80%)",
				WebkitMaskImage:
					"radial-gradient(120% 90% at 50% 30%, black 30%, transparent 80%)",
			}}
		>
			<canvas
				ref={ref}
				width={RES_W}
				height={RES_H}
				className="h-full w-full"
				style={{ filter: "blur(48px)", transform: "scale(1.25)", opacity: 0.9 }}
			/>
		</div>
	);
}
