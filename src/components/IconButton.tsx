"use client";

import type { MouseEvent, ReactNode } from "react";

interface IconButtonProps {
	onClick: (e: MouseEvent<HTMLButtonElement>) => void;
	title: string;
	children: ReactNode;
}

export function IconButton({ onClick, title, children }: IconButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className="group p-1.5 rounded-[7px] transition-colors hover:bg-white/[0.08] cursor-pointer"
		>
			<span className="block text-white/[0.56] transition-colors group-hover:text-white/[0.88]">
				{children}
			</span>
		</button>
	);
}
