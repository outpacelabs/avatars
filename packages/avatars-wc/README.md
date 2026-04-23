# @outpacelabs/avatars-wc

Web Component (Custom Element) for [@outpacelabs/avatars](https://www.npmjs.com/package/@outpacelabs/avatars). Works with Angular, Lit, Alpine.js, HTMX, vanilla HTML, or any framework that supports custom elements.

```sh
pnpm add @outpacelabs/avatars @outpacelabs/avatars-wc
```

```ts
import "@outpacelabs/avatars-wc";
```

```html
<gradient-avatar id="7" size="64"></gradient-avatar>
<gradient-avatar seed="user-123" size="48" preview></gradient-avatar>
<gradient-avatar id="1" base-path="https://cdn.example.com/avatars"></gradient-avatar>
```

### Attributes

| Attribute | Type | Notes |
| --- | --- | --- |
| `id` | number (1–50) | Takes precedence over `seed`. |
| `seed` | string | Hashed to a stable avatar. |
| `size` | number | Default 32. |
| `base-path` | string | Default `/avatars`. |
| `preview` | boolean | Present = use WebP preview. |
| `alt` | string | Default "Avatar". |

Attributes are reactive — changing them updates the rendered image.

### Custom tag name

```ts
import { defineGradientAvatar } from "@outpacelabs/avatars-wc";
defineGradientAvatar("op-avatar");  // register as <op-avatar>
```

See [`@outpacelabs/avatars`](https://www.npmjs.com/package/@outpacelabs/avatars) for how to serve the asset files.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
