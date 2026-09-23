# @rocket.chat/css-supports

## 0.31.26-rc.0

### Patch Changes

- ([#41859](https://github.com/RocketChat/Rocket.Chat/pull/41859)) Moved `@rocket.chat/css-supports` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release. The memoized, SSR-safe `CSS.supports` facade keeps the same API and runtime behaviour; only its build, lint and test wiring changed, none of which is published.
