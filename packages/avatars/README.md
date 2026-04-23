# @outpacelabs/avatars

50 beautifully handcrafted gradient avatars by [Outpace Studios](https://outpacestudios.com). Free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Browse them at [avatars.outpace.systems](https://avatars.outpace.systems).

This is the **framework-agnostic core** — it ships the image assets and URL helpers. If you want a ready-made component, install one of the framework wrappers:

- React: [`@outpacelabs/avatars-react`](https://www.npmjs.com/package/@outpacelabs/avatars-react)
- Vue: [`@outpacelabs/avatars-vue`](https://www.npmjs.com/package/@outpacelabs/avatars-vue)
- Svelte: [`@outpacelabs/avatars-svelte`](https://www.npmjs.com/package/@outpacelabs/avatars-svelte)
- Solid: [`@outpacelabs/avatars-solid`](https://www.npmjs.com/package/@outpacelabs/avatars-solid)
- Web Component (any framework / vanilla): [`@outpacelabs/avatars-wc`](https://www.npmjs.com/package/@outpacelabs/avatars-wc)

## Install

```sh
pnpm add @outpacelabs/avatars
```

## Serve the assets

The package ships the avatar files inside `assets/`. You need to serve them from somewhere your app can reach. Pick one:

**Copy to your public folder:**

```sh
cp -R node_modules/@outpacelabs/avatars/assets public/avatars
```

Assets are then available at `/avatars/avatar-1.jpg`, `/avatars/previews/avatar-1.webp`, etc.

**Or upload to a CDN** and pass the CDN URL as `basePath`.

## API

```ts
import {
  AVATARS,
  AVATAR_COUNT,
  getAvatarById,
  getAvatarBySeed,
  getAvatarUrl,
} from "@outpacelabs/avatars";

AVATAR_COUNT;
// 50

getAvatarUrl(7, { basePath: "/avatars" });
// "/avatars/avatar-7.jpg"

getAvatarUrl("jesse@outpace.com", { preview: true });
// "/avatars/previews/avatar-42.webp"
```

| Function | Returns |
| --- | --- |
| `getAvatarById(id)` | `Avatar \| undefined` — lookup by 1–50 id |
| `getAvatarBySeed(seed)` | `Avatar` — deterministic hash of any string |
| `getAvatarUrl(idOrSeed, { basePath?, preview? })` | `string` — URL to render |
| `hashSeed(seed)` | `number` — internal hash helper |

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Please credit Outpace Studios with a link to [avatars.outpace.systems](https://avatars.outpace.systems).
