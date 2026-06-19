import type { Metadata } from "next";
import { DocsContent } from "@/components/DocsContent";

export const metadata: Metadata = {
	title: "Docs",
	description:
		"Documentation for @outpacelabs/avatars — a React component for deterministic mesh-gradient avatars. Installation, props, examples, and engine helpers.",
	alternates: {
		canonical: "https://avatars.outpacestudios.com/docs",
	},
	openGraph: {
		title: "@outpacelabs/avatars — Docs",
		description:
			"A React component for deterministic mesh-gradient avatars. A unique gradient for every seed, no stored images.",
		url: "https://avatars.outpacestudios.com/docs",
	},
};

export default function DocsPage() {
	return <DocsContent />;
}
