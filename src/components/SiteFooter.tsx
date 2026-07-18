import type { ReactNode } from "react";

/**
 * Shared page sign-off: a thin divider above the Outpace Studios footer.
 * The docs and changelog both end with this, so it lives in one place.
 */

const INK = "rgba(255,255,255,0.92)";
const BODY = "rgba(255,255,255,0.62)";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			style={{
				color: INK,
				textDecoration: "underline",
				textDecorationColor: "rgba(255,255,255,0.9)",
				textUnderlineOffset: "2px",
			}}
		>
			{children}
		</a>
	);
}

export function SiteFooter() {
	return (
		<>
			{/* Thin divider above the footer (dark-mode: black → white). */}
			<div
				aria-hidden
				style={{
					width: 40,
					height: 1,
					background: "rgba(255,255,255,0.12)",
					margin: "64px auto 0",
				}}
			/>

			<footer style={{ padding: "64px 24px 96px", textAlign: "center" }}>
				<div
					style={{
						display: "inline-flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 24,
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 8,
						}}
					>
						<p
							style={{
								margin: 0,
								fontSize: 14,
								lineHeight: 1.3,
								fontWeight: 450,
								letterSpacing: "-0.1px",
								color: INK,
							}}
						>
							By Outpace Studios
						</p>
						<p
							style={{
								margin: 0,
								fontSize: 14,
								lineHeight: 1.45,
								letterSpacing: "0.1px",
								color: BODY,
							}}
						>
							Brands, interfaces, and motion for
							<br />
							venture-backed companies
						</p>
					</div>
					<div style={{ display: "flex", gap: 16, fontSize: 14 }}>
						<FooterLink href="https://outpacestudios.com">Website</FooterLink>
						<FooterLink href="https://x.com/outpacestudios">
							X / Twitter
						</FooterLink>
					</div>
				</div>
			</footer>
		</>
	);
}
