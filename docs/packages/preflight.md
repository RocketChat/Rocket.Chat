## Pre-flight before reporting done

Run, in the workspace you changed:

```
yarn workspace <pkg-name> typecheck
yarn workspace <pkg-name> lint
yarn workspace <pkg-name> test
```

If a public surface (exported types / functions / components) changed, also run `yarn workspace @rocket.chat/meteor typecheck` to catch downstream breakage.
