# @outpacelabs/avatars-vue

Vue 3 component for [@outpacelabs/avatars](https://www.npmjs.com/package/@outpacelabs/avatars). Works with Nuxt.

```sh
pnpm add @outpacelabs/avatars @outpacelabs/avatars-vue
```

```vue
<script setup lang="ts">
import { GradientAvatar } from "@outpacelabs/avatars-vue";
</script>

<template>
  <GradientAvatar :id="7" :size="64" />
  <GradientAvatar seed="user-123" :size="48" preview />
  <GradientAvatar :id="1" base-path="https://cdn.example.com/avatars" />
</template>
```

See [`@outpacelabs/avatars`](https://www.npmjs.com/package/@outpacelabs/avatars) for how to serve the asset files.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
