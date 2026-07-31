import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { PlaygroundContent } from "@/components/PlaygroundContent";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Playground",
	description:
		"An extended playground for the generative gradient engine: deform the smooth mesh into liquid, swirl, wave, ripple, and melt, then tune amount, scale, detail, blur, harmony, and pattern.",
	alternates: { canonical: `${SITE}/play` },
	// Experimental playground, keep it out of search results for now.
	robots: { index: false, follow: true },
};

export default function PlayPage() {
	return (
		<div className={GeistMono.variable}>
			<PlaygroundContent />
		</div>
	);
}
