"use client";

import { useEffect, useRef } from "react";
import {
	generatePalette,
	seededRandom,
	toSeed,
} from "@/lib/avatars/mesh-gradient";
import { usePrefersReducedMotion } from "@/lib/utils/useReducedMotion";

/**
 * Ambient mesh behind the hero — the REAL avatar engine. It regenerates the
 * exact spots `drawMeshGradient` would for a seed (same palette via
 * generatePalette, same `seededRandom(s * 12345)` stream, same 8–13 spots,
 * placement, radii, the FF/DD/88/00 falloff, and the highlight), then animates
 * by drifting each spot around its base position. Drift params come from a
 * SEPARATE RNG stream so the base mesh stays identical to the avatar.
 *
 * Colorful, but low opacity + heavy blur → a subtle moving backdrop. Static for
 * reduced motion.
 */

const RES = 600;
// A fixed seed → a stable, colorful palette for the backdrop.
const SEED = "prism"; // tetradic — green/blue/magenta/orange

type Spot = {
	bx: number;
	by: number;
	radius: number;
	color: string;
	// drift
	ox: number;
	oy: number;
	speed: number;
	phase: number;
};

type Scene = {
	base: string;
	spots: Spot[];
	highlight: { x: number; y: number; r: number };
};

/** Rebuild the engine's mesh for `seed` (matches drawMeshGradient exactly), plus drift. */
function buildScene(seed: string): Scene {
	const s = toSeed(seed);
	const { colors } = generatePalette(seed);
	const random = seededRandom(s * 12345); // same stream drawMeshGradient uses

	const numSpots = 8 + Math.floor(random() * 5);
	const spots: Spot[] = [];
	for (let i = 0; i < numSpots; i++) {
		const angle = random() * Math.PI * 2;
		const distance = random() * RES * 0.4;
		const cx = RES / 2 + Math.cos(angle) * distance;
		const cy = RES / 2 + Math.sin(angle) * distance;
		spots.push({
			bx: cx + (random() - 0.5) * RES * 0.3,
			by: cy + (random() - 0.5) * RES * 0.3,
			radius: RES * (0.3 + random() * 0.4),
			color: colors[i % colors.length],
			ox: 0,
			oy: 0,
			speed: 0,
			phase: 0,
		});
	}
	spots.sort((a, b) => b.radius - a.radius);

	// Highlight (engine consumes two more from the same stream).
	const highlight = {
		x: RES * 0.3 + random() * RES * 0.2,
		y: RES * 0.3 + random() * RES * 0.2,
		r: RES * 0.3,
	};

	// Drift params — a SEPARATE stream, so the base mesh above is untouched.
	const drift = seededRandom((s ^ 0x9e3779b9) >>> 0);
	for (const sp of spots) {
		sp.ox = RES * (0.05 + drift() * 0.06);
		sp.oy = RES * (0.05 + drift() * 0.06);
		sp.speed = 0.03 + drift() * 0.05;
		sp.phase = drift() * Math.PI * 2;
	}

	return { base: colors[0], spots, highlight };
}

export function HeroShader() {
	const ref = useRef<HTMLCanvasElement>(null);
	const reduced = usePrefersReducedMotion();

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const scene = buildScene(SEED);
		let raf = 0;

		const frame = (tMs: number) => {
			const t = tMs / 1000;

			ctx.globalCompositeOperation = "source-over";
			ctx.fillStyle = scene.base;
			ctx.fillRect(0, 0, RES, RES);

			for (const sp of scene.spots) {
				const w = t * sp.speed * Math.PI * 2 + sp.phase;
				const x = sp.bx + Math.cos(w) * sp.ox;
				const y = sp.by + Math.sin(w) * sp.oy;
				const g = ctx.createRadialGradient(x, y, 0, x, y, sp.radius);
				g.addColorStop(0, `${sp.color}FF`);
				g.addColorStop(0.3, `${sp.color}DD`);
				g.addColorStop(0.6, `${sp.color}88`);
				g.addColorStop(1, `${sp.color}00`);
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, RES, RES);
			}

			const h = scene.highlight;
			const hg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
			hg.addColorStop(0, "rgba(255,255,255,0.15)");
			hg.addColorStop(1, "rgba(255,255,255,0)");
			ctx.fillStyle = hg;
			ctx.fillRect(0, 0, RES, RES);

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
					"radial-gradient(120% 90% at 50% 28%, black 32%, transparent 82%)",
				WebkitMaskImage:
					"radial-gradient(120% 90% at 50% 28%, black 32%, transparent 82%)",
			}}
		>
			<canvas
				ref={ref}
				width={RES}
				height={RES}
				className="h-full w-full object-cover"
				style={{ filter: "blur(26px)", transform: "scale(1.15)", opacity: 0.62 }}
			/>
		</div>
	);
}
