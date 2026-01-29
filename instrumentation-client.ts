import posthog from "posthog-js";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host:
			process.env.NODE_ENV === "development"
				? "https://us.i.posthog.com"
				: "/ingest",
		ui_host: "https://us.posthog.com",
		capture_pageview: true,
		capture_pageleave: true,
		capture_exceptions: true,
		debug: process.env.NODE_ENV === "development",
	});
}
