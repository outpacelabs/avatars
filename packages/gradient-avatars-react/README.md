# @outpacelabs/gradient-avatars-react

React component for [`@outpacelabs/gradient-avatars`](https://www.npmjs.com/package/@outpacelabs/gradient-avatars).
Renders a deterministic mesh-gradient avatar for any seed on a `<canvas>` —
the same seed always yields the same gradient.

```bash
npm i @outpacelabs/gradient-avatars-react
```

## Usage

```tsx
import { GradientAvatar } from "@outpacelabs/gradient-avatars-react";

<GradientAvatar seed={user.id} size={40} />
<GradientAvatar seed="jane@example.com" size={96} className="ring-2 ring-white/10" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | `string \| number` | — | Any value; each unique seed is a unique gradient. |
| `size` | `number` | `32` | Rendered size in pixels (square, circular crop). |
| `className` | `string` | `""` | Extra classes on the wrapper `<span>`. |

The engine helpers (`renderGradient`, `gradientToDataURL`, `gradientToBlob`,
`generatePalette`, …) are re-exported for convenience — e.g. to offer a
download/copy of the full-resolution image.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use with attribution. By [Outpace Studios](https://outpacestudios.com).
