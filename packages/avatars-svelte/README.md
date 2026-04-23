# @outpacelabs/avatars-svelte

Svelte component for [@outpacelabs/avatars](https://www.npmjs.com/package/@outpacelabs/avatars). Works with Svelte 4, Svelte 5, and SvelteKit.

```sh
pnpm add @outpacelabs/avatars @outpacelabs/avatars-svelte
```

```svelte
<script>
  import { GradientAvatar } from "@outpacelabs/avatars-svelte";
</script>

<GradientAvatar id={7} size={64} />
<GradientAvatar seed="user-123" size={48} preview />
<GradientAvatar id={1} basePath="https://cdn.example.com/avatars" />
```

See [`@outpacelabs/avatars`](https://www.npmjs.com/package/@outpacelabs/avatars) for how to serve the asset files.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
