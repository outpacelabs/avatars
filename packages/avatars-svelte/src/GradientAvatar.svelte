<script lang="ts">
	import { getAvatarUrl } from "@outpacelabs/avatars";

	/** Avatar id (1-50). Takes precedence over `seed`. */
	export let id: number | undefined = undefined;
	/** Seed string hashed to pick an avatar deterministically. */
	export let seed: string | undefined = undefined;
	/** Rendered size in pixels. Default: 32. */
	export let size = 32;
	/** Where avatar files are served from. Default: "/avatars". */
	export let basePath: string | undefined = undefined;
	/** Use the lower-res WebP preview. Default: false. */
	export let preview = false;
	export let alt = "Avatar";

	$: {
		if (id === undefined && seed === undefined) {
			throw new Error("GradientAvatar: either `id` or `seed` must be provided.");
		}
	}
	$: src = getAvatarUrl((id ?? seed) as number | string, { basePath, preview });
</script>

<img
	{src}
	{alt}
	width={size}
	height={size}
	draggable="false"
	style="border-radius:9999px"
	{...$$restProps}
/>
