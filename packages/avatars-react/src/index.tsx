import { getAvatarUrl } from "@outpacelabs/avatars";
import type { ImgHTMLAttributes } from "react";

type ImgProps = Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	"src" | "width" | "height" | "id"
>;

export interface GradientAvatarProps extends ImgProps {
	/** Avatar id (1-50). Takes precedence over `seed`. */
	id?: number;
	/** Seed string hashed to pick an avatar deterministically. */
	seed?: string;
	/** Rendered size in pixels. Default: 32. */
	size?: number;
	/** Where avatar files are served from. Default: "/avatars". */
	basePath?: string;
	/** Use the lower-res WebP preview. Default: false. */
	preview?: boolean;
}

export function GradientAvatar({
	id,
	seed,
	size = 32,
	basePath,
	preview,
	alt = "Avatar",
	style,
	...rest
}: GradientAvatarProps) {
	if (id === undefined && seed === undefined) {
		throw new Error("GradientAvatar: either `id` or `seed` must be provided.");
	}
	const src = getAvatarUrl(id ?? (seed as string), { basePath, preview });
	return (
		<img
			src={src}
			alt={alt}
			width={size}
			height={size}
			draggable={false}
			style={{ borderRadius: "9999px", ...style }}
			{...rest}
		/>
	);
}

export type { Avatar, AvatarUrlOptions } from "@outpacelabs/avatars";
export {
	AVATAR_COUNT,
	AVATARS,
	getAvatarById,
	getAvatarBySeed,
	getAvatarUrl,
} from "@outpacelabs/avatars";
