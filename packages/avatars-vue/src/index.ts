import { getAvatarUrl } from "@outpacelabs/avatars";
import { type PropType, defineComponent, h } from "vue";

export const GradientAvatar = defineComponent({
	name: "GradientAvatar",
	props: {
		id: { type: Number as PropType<number>, default: undefined },
		seed: { type: String as PropType<string>, default: undefined },
		size: { type: Number, default: 32 },
		basePath: { type: String as PropType<string>, default: undefined },
		preview: { type: Boolean, default: false },
		alt: { type: String, default: "Avatar" },
	},
	setup(props, { attrs }) {
		return () => {
			if (props.id === undefined && props.seed === undefined) {
				throw new Error(
					"GradientAvatar: either `id` or `seed` must be provided.",
				);
			}
			const src = getAvatarUrl(props.id ?? (props.seed as string), {
				basePath: props.basePath,
				preview: props.preview,
			});
			return h("img", {
				src,
				alt: props.alt,
				width: props.size,
				height: props.size,
				draggable: false,
				style: { borderRadius: "9999px" },
				...attrs,
			});
		};
	},
});

export {
	AVATAR_COUNT,
	AVATARS,
	getAvatarById,
	getAvatarBySeed,
	getAvatarUrl,
} from "@outpacelabs/avatars";
export type { Avatar, AvatarUrlOptions } from "@outpacelabs/avatars";
