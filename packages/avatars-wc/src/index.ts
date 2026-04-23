import { getAvatarUrl } from "@outpacelabs/avatars";

export const TAG_NAME = "gradient-avatar";

const SafeHTMLElement =
	typeof HTMLElement === "undefined"
		? (class {} as unknown as typeof HTMLElement)
		: HTMLElement;

export class GradientAvatarElement extends SafeHTMLElement {
	static get observedAttributes(): string[] {
		return ["id", "seed", "size", "base-path", "preview", "alt"];
	}

	private img: HTMLImageElement | null = null;

	connectedCallback(): void {
		if (!this.img) {
			this.img = document.createElement("img");
			this.img.draggable = false;
			this.img.style.borderRadius = "9999px";
			this.appendChild(this.img);
		}
		this.update();
	}

	attributeChangedCallback(): void {
		if (this.img) this.update();
	}

	private update(): void {
		if (!this.img) return;
		const idAttr = this.getAttribute("id");
		const seedAttr = this.getAttribute("seed");
		const sizeAttr = this.getAttribute("size");
		const basePath = this.getAttribute("base-path") ?? undefined;
		const preview = this.hasAttribute("preview");
		const alt = this.getAttribute("alt") ?? "Avatar";

		const idNum = idAttr !== null ? Number(idAttr) : undefined;
		const idOrSeed =
			idNum !== undefined && Number.isFinite(idNum) ? idNum : (seedAttr ?? "");

		if (idOrSeed === "") {
			console.warn(
				"<gradient-avatar>: either `id` or `seed` attribute must be provided.",
			);
			return;
		}

		this.img.src = getAvatarUrl(idOrSeed, { basePath, preview });
		this.img.alt = alt;
		const size = sizeAttr ? Number(sizeAttr) : 32;
		this.img.width = size;
		this.img.height = size;
	}
}

export function defineGradientAvatar(tagName: string = TAG_NAME): void {
	if (typeof customElements === "undefined") return;
	if (!customElements.get(tagName)) {
		customElements.define(tagName, GradientAvatarElement);
	}
}

if (typeof customElements !== "undefined") {
	defineGradientAvatar();
}

export {
	AVATAR_COUNT,
	AVATARS,
	getAvatarById,
	getAvatarBySeed,
	getAvatarUrl,
} from "@outpacelabs/avatars";
export type { Avatar, AvatarUrlOptions } from "@outpacelabs/avatars";
