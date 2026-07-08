<a href="https://avatars.outpacestudios.com">
  <img src="https://avatars.outpacestudios.com/meta.jpg" alt="@outpacelabs/avatars, by Outpace Studios" width="100%" />
</a>

<h1 align="center">@outpacelabs/avatars</h1>

<p align="center">
  Generative gradient avatars for React. A unique gradient for every seed, with no stored images and no network.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@outpacelabs/avatars"><img src="https://img.shields.io/npm/v/@outpacelabs/avatars?color=000&labelColor=000" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@outpacelabs/avatars"><img src="https://img.shields.io/badge/gzipped-2.3_kB-000?labelColor=000" alt="gzipped size" /></a>
  <img src="https://img.shields.io/badge/dependencies-0-000?labelColor=000" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/types-included-000?labelColor=000" alt="types included" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-000?labelColor=000" alt="license" /></a>
</p>

<p align="center">
  <a href="https://avatars.outpacestudios.com"><b>Live playground →</b></a> &nbsp;·&nbsp;
  <a href="https://avatars.outpacestudios.com/docs"><b>Docs →</b></a> &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/package/@outpacelabs/avatars"><b>npm →</b></a>
</p>

---

Give it any string or number (a user id, an email, a username) and it paints a
unique, good-looking gradient on a `<canvas>`. The same seed always yields the
same gradient, so you get stable avatars with **nothing to store and nothing to
fetch**.

## Quick start

Install the package in your app with whichever package manager you use:

```bash
npm i @outpacelabs/avatars   # or: pnpm add / yarn add / bun add
```

```tsx
import { GradientAvatar } from "@outpacelabs/avatars";

function UserAvatar({ user }) {
  return <GradientAvatar seed={user.id} size={40} />;
}
```

Full API, props, and engine helpers are in the
**[package README](./packages/avatars/README.md)** and the
**[docs site](https://avatars.outpacestudios.com/docs)**.

## What's in this repo

| Path | What |
|------|------|
| [`packages/avatars`](./packages/avatars) | **`@outpacelabs/avatars`**, the published React component + bundled gradient engine. |
| [`src`](./src) | The Next.js site at [avatars.outpacestudios.com](https://avatars.outpacestudios.com), the live generator and docs. |

## Local development

This repo is managed with **pnpm** (see `packageManager` in `package.json`): the lockfile and workspace config are pnpm's, and deploys build from them. Use pnpm here even if your own apps use something else.

```bash
pnpm install     # install deps
pnpm dev         # run the site → http://localhost:3000
pnpm build       # production build
pnpm lint        # biome + eslint
pnpm test        # engine property tests (palette stability)
```

The package lives in [`packages/avatars`](./packages/avatars); `pnpm packages:build` from the root (or `pnpm build` inside the package) produces the npm bundle.

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
