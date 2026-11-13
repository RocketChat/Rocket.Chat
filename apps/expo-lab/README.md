# expo-lab

Sandbox Expo app to try Tamagui, the Rocket.Chat SDK packages and `@rocket.chat/fuselage` in React Native.

## Running

Needs Node `>=22.22.3` (the repo's `engines`) and the workspace packages that Fuselage imports built first:
`fuselage`, `fuselage-tokens`, `fuselage-hooks`, `icons`, `memo`, `css-in-js`, `css-supports`, `stylis-logical-props-middleware`, `emitter`
(`yarn build` in each package; Metro resolves their `dist/`).

```sh
CI=1 npx expo export --platform web
CI=1 npx expo export --platform ios
```

iOS simulator (Xcode and CocoaPods installed; Node 22.22.3):

```sh
export PATH=$HOME/.volta/tools/image/node/22.22.3/bin:$PATH
npx expo run:ios --device "iPhone 17 Pro"   # prebuilds ios/ (gitignored), pod install, build, launch
npx expo start --dev-client                 # later runs: Metro only, with reloads
```

The first build took about 18 minutes, most of it `pod install` downloading the React Native and Hermes prebuilt tarballs (about 400 MB, debug and release). Later builds reuse them.

## Fuselage on React Native: findings

`App.tsx` renders static `Message` rows (`Message`, `MessageLeftContainer`, `Avatar`, `MessageContainer`, `MessageHeader`, `MessageName`, `MessageUsername`, `MessageTimestamp`, `MessageBody`).

### Web: works

- `npx expo export --platform web` bundles; served and checked in Chromium: the rows render fully styled (avatar, bold name, username, timestamp, wrapped body).
- Fuselage is consumed as its published build (`dist/fuselage.production.js`, a CJS bundle with the Tamagui runtime inside), not through the zero-runtime compiler. The stylesheet is imported explicitly: `import '@rocket.chat/fuselage/dist/fuselage.css'`. Metro extracts it to `_expo/static/css/`.
- Warning (not an error): `Importing local resources in CSS is not supported yet` for the `@font-face` `url(./fonts/InterVariable.woff2)`. The font is not served (404), so text falls back to the system font.
- The light/dark toggle only changes the screen background. Fuselage colors come from `--rcx-color-*` custom properties with light fallbacks, set by the app's palette provider, which is not part of `fuselage.css`. In dark mode the name and body text stay dark on the dark background.

### iOS: bundles, then fails at module load (observed on the iPhone 17 Pro simulator)

`expo run:ios` builds and installs (0 errors), Metro bundles 1065 modules, and the app opens on a red screen:

```
[runtime not ready]: ReferenceError: Property 'addEventListener' doesn't exist
```

The stack is only `metroRequire`/`loadModuleImplementation` frames, so the throw is at module evaluation, before `App` renders. Reloading after the first launch can also show `App entry not found: main was not registered`, a consequence of the entry module never finishing.

Cause: Fuselage's `dist` embeds its own copy of `@tamagui/web` built for the web target. In `createComponent` it registers press-cancel listeners behind `typeof window !== 'undefined'` (the `TAMAGUI_TARGET !== 'native'` half of the guard is already folded away at build time). React Native defines `window`, so the guard passes, and it then calls the bare global `addEventListener('mouseup' | 'touchend' | 'touchcancel', ...)`, which Hermes does not have. Source: `@tamagui/web/src/createComponent.tsx` (`addEventListener('mouseup', cancelPresses)`), present in `packages/fuselage/dist/fuselage.development.js` and, minified, in the production build. The other `document.`/`window.addEventListener` calls in the bundle (react-aria and others) are guarded by `typeof document` or run inside effects, so they are not the first failure. Fixing this one will likely only reveal the next blocker; the table below is still unobserved.

A Tamagui-only screen (`YStack`, `Text`, `Button` from `tamagui` with this app's `tamagui.config.ts`) renders natively on the same build: styled text and button, `Switch to dark` button present. So the native toolchain, Metro and the Tamagui runtime work; the failure is specific to Fuselage's web-target dist.

Blockers expected next (read from the bundle, not yet observed):

| Blocker | Evidence | Effect on RN |
| --- | --- | --- |
| CSS import | `import '@rocket.chat/fuselage/dist/fuselage.css'` | Metro drops CSS on native: bundles, but nothing is styled |
| `.styles.css` / custom properties | Frames use `var(--rcx-*, fallback)` values and `rem` units (`0.875rem`, `calc(1.25rem + 1.25rem)`) | Web-only values; React Native has no `var()` or `rem` |
| DOM tags | The dist contains about 130 `jsx("div")`, 39 `jsx("span")`, 9 `jsx("a")`, 3 `jsx("img")`, plus `render: 'div'/'span'/'button'/'label'/'input'` frames | React Native has no host component for them: the first `Message` fails at render |
| `render={<tag/>}` elements | `MessageName` etc. pass a literal `<span ...aria/data attrs />` as `render` | Same: a DOM element where RN needs `View`/`Text` |
| `className` and `rcx-*` classes | Every part builds `className` (`cx('rcx-message-header__name', ...)`) | No effect on native; also the only hook for the `.styles.css` rules |
| DOM globals | `document.createElement`, `document.head`, `document.styleSheets`, `window.matchMedia`, `react-dom` required at module load | Needs guards; module evaluation may already throw |
| Web-only props | `aria-*`/`data-*` forwarding, `pickWebPressHandlers` (`onClick`, mouse handlers) | Not RN props (`onPress`, `accessibilityLabel`) |

Fuselage's own doc scopes native readiness narrowly (frames and prop types portable; values and CSS web-only, see G7 in `docs/frontend/fuselage-tamagui-components.md`), which matches these findings.

### Tamagui token types (still open)

Augmenting `TamaguiCustomConfig` from `@tamagui/web` with `typeof config` (`@tamagui/config/v5` defaults) makes token props type-checked, but the accepted names lose their `$` prefix (`'color1'` is suggested for `'$color1'`), so `'$background'`, `'$color1'` and `'$4'` are all rejected. Two `@tamagui/web@3.0.18` copies exist (root and `apps/expo-lab/node_modules`), the likely cause. Not fixed; `App.tsx` does not use token props.

## Fuselage source on native: spike

Goal: render real Fuselage components on iOS by resolving `@rocket.chat/fuselage` to `packages/fuselage/src` (not the web-target `dist`). Fuselage source is untouched. Screenshots are in `/tmp/expolab/shots/` (`3-` to `9-`).

### Config that was needed

- `metro.config.js`: `@rocket.chat/fuselage` resolves to `packages/fuselage/src/index.runtime.ts` (it registers Fuselage's Tamagui config; plain `index.ts` does not); `@tamagui/web` resolves to the app's copy; every `*.css`/`*.scss` import resolves to `stubs/empty.js`; `packages/fuselage` is added to `watchFolders`. With the monorepo watch folder the dev server root is the repo root, so the bundle URL is `/apps/expo-lab/index.bundle`.
- `App.tsx`: `import '@tamagui/core'` for its side effect, and a `TamaguiProvider` (from `@tamagui/web`) with `tamaguiConfig` imported from `packages/fuselage/src/tamagui.config`.
- `TAMAGUI_TARGET=native` was not needed: `@tamagui/web` resolves its native build through the `react-native` export condition, so the `addEventListener` failure is gone.
- Run Metro with `node node_modules/expo/bin/cli start --dev-client` (the `rtk` hook mangles `npx`).

### Observed blockers, in order

1. `Err0 TamaguiConfig: no config is available. Received config=null...` at `config.native.js:70` (Badge). Cause: `index.ts` never calls `createTamagui`; only `index.runtime.ts` does. Fixed by aliasing to `index.runtime.ts`.
2. `Can't find Tamagui configuration` at `useThemeState.native.js:77` (`!parentId && !isRoot`). On native a frame needs a `TamaguiProvider` ancestor (web uses CSS). Fixed by wrapping the app. (Two `@tamagui/web` copies were not the cause; the config was found once registered.)
3. `View config getter callback for component 'span' must be a function (received 'undefined')` at `ReactNativeViewConfigRegistry.js:103`. `@tamagui/web` base `Text`/`View` have no native host component until `@tamagui/core`'s runtime calls `setupHooks({ getBaseViews })`; without it `createComponent` falls back to the string `'span'`/`'div'`. Fixed by `import '@tamagui/core'` in the app.
4. Type error only: `TamaguiProvider config={tamaguiConfig}` is not assignable (two `@tamagui/web` type copies); `App.tsx` uses a `@ts-expect-error` with the reason.

### Per-component result (iPhone 17 Pro)

| Component | Result |
| --- | --- |
| `Badge variant='primary'` | Renders without error: bold "3" (`fontWeight: 700`). No background, radius or padding: `var(--rcx-*, fallback)` and `rem` values are not applied (`6-badge-attempt4.png`). |
| `Button variant='primary'` | Renders without error: the text "Send" at the left edge, no fill, padding or press feedback (`7-button.png`). |
| `Avatar size='x36' url=...` | No error and nothing visible; not investigated whether it is the `img`/`rem` size or the image load (`8-avatar.png`, `9-final.png`). |

### Next blockers, not yet addressed

- Values: every `var(--rcx-*, fallback)`, `rem`, `calc()`, `fit-content`, `paddingBlock/Inline`, `wordBreak`, `textOverflow` in frames is web-only. Fix in Fuselage: generate native-valid frame values (numbers/tokens) in `scripts/generate-frame-values.mts`, or register `--rcx-*` as Tamagui tokens in `src/tamagui.config.ts` (currently `createTokens({ color: {}, space: {}, ... })` is empty).
- `render={<span/>}` and `render: 'span'` in each frame (e.g. `components/Badge/Badge.tsx`): DOM elements and tags do not apply on native; need a platform split for the `render` prop.
- `className`/`rcx-*` classes, `ariaAndDataAttributes` and `pickWebPressHandlers`: no effect on native; `onClick` is not `onPress`.
- Module-scope DOM globals: the whole of `index.runtime.ts` loaded without throwing, so none were hit at load.
