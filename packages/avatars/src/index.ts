export const AVATAR_COUNT = 50;

export interface Avatar {
	id: number;
	file: string;
	previewFile: string;
}

export const AVATARS: readonly Avatar[] = Array.from(
	{ length: AVATAR_COUNT },
	(_, i) => {
		const id = i + 1;
		return {
			id,
			file: `avatar-${id}.jpg`,
			previewFile: `previews/avatar-${id}.webp`,
		};
	},
);

export function getAvatarById(id: number): Avatar | undefined {
	if (!Number.isInteger(id) || id < 1 || id > AVATAR_COUNT) return undefined;
	return AVATARS[id - 1];
}

export function hashSeed(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

export function getAvatarBySeed(seed: string): Avatar {
	const index = hashSeed(seed) % AVATAR_COUNT;
	return AVATARS[index];
}

export interface AvatarUrlOptions {
	basePath?: string;
	preview?: boolean;
}

export function getAvatarUrl(
	idOrSeed: number | string,
	options: AvatarUrlOptions = {},
): string {
	const { basePath = "/avatars", preview = false } = options;
	const avatar =
		typeof idOrSeed === "number"
			? getAvatarById(idOrSeed)
			: getAvatarBySeed(idOrSeed);
	if (!avatar) {
		throw new Error(
			`Invalid avatar id: ${idOrSeed}. Must be an integer between 1 and ${AVATAR_COUNT}.`,
		);
	}
	const file = preview ? avatar.previewFile : avatar.file;
	const trimmed = basePath.replace(/\/+$/, "");
	return `${trimmed}/${file}`;
}
