# @outpacelabs/avatars-react

React component for [@outpacelabs/avatars](https://www.npmjs.com/package/@outpacelabs/avatars).

```sh
pnpm add @outpacelabs/avatars @outpacelabs/avatars-react
```

```tsx
import { GradientAvatar } from "@outpacelabs/avatars-react";

<GradientAvatar id={7} size={64} />
<GradientAvatar seed="user-123" size={48} preview />
<GradientAvatar id={1} basePath="https://cdn.example.com/avatars" />
```

All other `<img>` props (`className`, `style`, `onClick`, etc.) pass through.

See [`@outpacelabs/avatars`](https://www.npmjs.com/package/@outpacelabs/avatars) for how to serve the asset files.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
