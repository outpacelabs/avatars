import { getAvatarUrl } from "@outpacelabs/avatars";
import { type JSX, mergeProps, splitProps } from "solid-js";

export interface GradientAvatarProps
	extends Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, "src" | "id"> {
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

export function GradientAvatar(rawProps: GradientAvatarProps) {
	const props = mergeProps({ size: 32, preview: false, alt: "Avatar" }, rawProps);
	const [local, others] = splitProps(props, [
		"id",
		"seed",
		"size",
		"basePath",
		"preview",
		"alt",
		"style",
	]);
	const src = () => {
		if (local.id === undefined && local.seed === undefined) {
			throw new Error("GradientAvatar: either `id` or `seed` must be provided.");
		}
		return getAvatarUrl(local.id ?? (local.seed as string), {
			basePath: local.basePath,
			preview: local.preview,
		});
	};
	return (
		<img
			src={src()}
			alt={local.alt}
			width={local.size}
			height={local.size}
			draggable={false}
			style={{ "border-radius": "9999px", ...(local.style as object) }}
			{...others}
		/>
	);
}

export {
	AVATAR_COUNT,
	AVATARS,
	getAvatarById,
	getAvatarBySeed,
	getAvatarUrl,
} from "@outpacelabs/avatars";
export type { Avatar, AvatarUrlOptions } from "@outpacelabs/avatars";
