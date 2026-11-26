# expo-lab

Sandbox Expo app to try Tamagui, the Rocket.Chat SDK packages and `@rocket.chat/fuselage` in React Native.

`App.tsx` is a chat prototype on the SDK packages (no Fuselage): log in to a server you type, list rooms, open a room, see live messages, send. Files: `src/session.ts` (login, `DDPSDK`), `src/twoFactor.ts`, `src/api.ts` (rooms, history, send), `src/Login.tsx`, `src/Rooms.tsx`, `src/Room.tsx`. The session lives in memory only.
The SDK packages are consumed from their `dist/`; build them first: `yarn workspaces foreach -Rpt --from @rocket.chat/ddp-client run build`.

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

## Converted components on native

This branch (`feat/expo-lab-all`) combines the open Fuselage to Tamagui conversion PRs (L1 to L6 and Icon, see `MERGE-NOTES.md`). The gallery (`src/Gallery.tsx`) renders them with the same source alias as the spike. Open it from the "Components" button on the login screen, or start Metro with `EXPO_PUBLIC_GALLERY=1` to open it first. It mounts its own `TamaguiProvider` with Fuselage's config and is loaded on demand, because importing Fuselage calls `createTamagui` again; the chat screens are untouched. `Callout` needs no `ResizeObserver` stub since the `useResizeObserver` guard of the native-enabling branches (see `NATIVE-SWEEP.md`).

Observed on the iPhone 17 Pro simulator (dev client, Metro on port 8085). Screenshots are in `/tmp/expolab/shots/`: `12-gallery-top.png` (buttons to chip), `16-gallery.png` (callouts, message parts, rows), `11-gallery.png` (rows, check box). The simulator has no touch tool here, so presses were not exercised: "press" is not verified for any row.

| Component | Converted by a PR | Renders | Styled | Press | Observed |
| --- | --- | --- | --- | --- | --- |
| `Button` primary, secondary, danger | L1 | yes | fill, radius and padding applied (blue, grey, red) | not verified | Full-width, label left-aligned and black on every kind (no centring, no `on-primary` text colour). |
| `Badge` primary, secondary, danger | L1 | yes | yes: pill, fill, white bold text | no handler | Matches the web look. Spike: bold text only. |
| `Chip` | L1 | yes | grey fill, radius, padding | not verified | The dismiss glyph shows as an emoji (icon font not applied). |
| `CheckBox` | L1 | yes | empty box outline only | not verified | Rendered as the `render: 'input'` element; no checked state drawn. |
| `Icon` | Icon PR | yes, wrong glyph | n/a | no handler | A private-use character is drawn without the icon font, so the system shows an emoji (`bell` shows a person emoji). |
| `Callout` info, danger | L2 | yes (the `useResizeObserver` guard replaced the stub) | border, radius, title weight, type colour | no handler | Without the stub: `ReferenceError: Property 'ResizeObserver' doesn't exist` (`Callout.tsx:186`, `useResizeObserver`). The icon is the same emoji problem. |
| `MessageName`, `MessageBody`, `MessageTimestamp`, `MessageUsername`, `MessageHeader` inside `Message` | L6 and Item (L3) | yes | bold name, grey timestamp, spacing | no handler | `Message` renders with these parts. |
| `Item` row (`ItemIcon`, `ItemContent`, `ItemTitle`, `ItemMeta`) | L3 | yes | row layout and meta aligned at the end | not verified | Icon again an emoji. |
| `SidebarItem` | L3 and L5 | yes | text only | not verified | No surface or hover paint visible at rest. |
| `Avatar` | not converted | no | n/a | n/a | `Invariant Violation: View config getter callback for component 'img' must be a function` at `Avatar.tsx:23` (`<img>`). Same error inside `Message` when it holds an `Avatar` (`AvatarContainer.tsx:9`). |
| `Banner` | not converted | no | n/a | n/a | Same invariant for `h6` (`Banner.tsx:87`). |
| `Tag` | not converted | no | n/a | n/a | Same invariant for `span` (`Tag.tsx:37`, `<Box is='span'>`). |

### What the conversion PRs changed natively

Against the earlier spike (Badge showed bold text only, Button text at the left edge with no fill, Avatar nothing): the converted frames now carry their colours, radius, padding and layout on native. The spike's missing values (`var(--rcx-*)`, `rem`) were the blocker; the frames now name tokens and theme keys, which Tamagui resolves on native. Badge, Button, Chip, Callout, Message parts and Item rows are visibly styled. The components not in the PRs (Avatar, Banner, Tag) still fail on DOM tags.

Native against web, per component, with images and a per-PR list of what could already be done in each conversion PR: [NATIVE-GAP.md](NATIVE-GAP.md). The web reference is `src/Gallery.web.tsx` (published `dist`, `EXPO_PUBLIC_GALLERY=1 npx expo export --platform web`); the Metro alias to the source and the CSS stub apply to native only. Two notes in the list below are out of date: `Icon` already names `fontFamily: 'RocketChat'` (the app only has to load the font, the gallery does with `expo-font`), and `Avatar`, `Banner` and `Tag` are skipped natively unless `EXPO_PUBLIC_GALLERY_PROBE=1`.

### Remaining fixes, in Fuselage (not done here, other branches' work)

- Press: `pickWebPressHandlers` maps `onPress` to `onClick`, which a native `View` does not take. Pass `onPress` through on native in `packages/fuselage/src/helpers/pickWebPressHandlers.ts` (or a native twin of it).
- Button text: the label is not centred and ignores the variant text colour; `Button.tsx` frame needs `justifyContent: 'center'` and a text colour the label inherits on native.
- Icon font: `Icon.tsx` writes the glyph character with no `fontFamily`; the app has to load `packages/icons/dist/font` and the frame must name it on native.
- `useResizeObserver` (`@rocket.chat/fuselage-hooks`) now guards a missing `ResizeObserver` (done by the native-enabling branches); the app stub is gone.
- Avatar, Banner, Tag and every `Box`-based component: render `View`/`Text`/`Image` on native (not part of L1 to L6).

## SDK on React Native: findings

Observed on the iPhone 17 Pro simulator (dev client, RN 0.88, Hermes) against open.rocket.chat with a personal access token. No polyfill and no Metro change were needed for any of the three packages.

| Package | Needed | Notes |
| --- | --- | --- |
| `@rocket.chat/api-client` | nothing | Uses global `fetch`, `FormData`, `File`, `XMLHttpRequest`; all exist in RN. `query-string` resolves. Rejections are RN's polyfilled `Response`, so `instanceof Response` is false: check for a `status` field instead. |
| `@rocket.chat/ddp-client` | nothing | `DDPSDK.create(url)` uses the global `WebSocket` (RN's); `ws` is a devDependency only and is never imported. Connect, resume-token login and `stream('room-messages', rid, cb)` reach `ready`. `sdk.rest` is the api-client `RestClient` with the DDP account's credentials. |
| `@rocket.chat/emitter` | nothing | |

Other findings:

- `subscriptions.get` is not in `@rocket.chat/rest-typings`, so `rest.get` rejects it at type level; `rest.send(path, 'GET')` plus a local type is used.
- A Metro left running from an earlier session on port 8081 served a broken state (`Got unexpected undefined ... nullthrows.js`); start Metro on a free `--port` and open the dev client with `exp+expo-lab://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>`.
- Login with a token: the app calls `sdk.account.setCredentials({ id, token })` and `sdk.connection.connect()`; the SDK then sends the DDP `login` with `resume` itself on every (re)connection.

### Two-factor authentication

Read from `apps/meteor/server/api/ApiClass.ts` (`login` route, `loginCompatibility`) and `apps/meteor/server/lib/2fa/code/index.ts`:

- `POST /v1/login` with a user that has 2FA answers **401** (not 400) with `{ error: 'totp-required', details: { method: 'totp' | 'email' } }`. `RestClient`'s built-in `handleTwoFactorChallenge` only reacts to 400, so it does not fire for login; `src/twoFactor.ts` handles it.
- Retry the same request with `code` in the body (the `x-2fa-code` header is read too). The server wraps it as `{ totp: { code, login } }`; the method is not sent: the code is checked against the user's first enabled method (TOTP before email). The login path disables the password fallback, so `password` (sha-256 of the password) is never requested here.
- A wrong code answers 401 `totp-invalid` (the app asks again and says the code was invalid); too many wrong email codes answer `totp-max-attempts` (shown as an error).
- For `email` the server sends the code when it answers `totp-required`. A resend goes through `POST /v1/twoFactorChallenges.sendEmailCode { challengeId }` (the id is in the `totp-required` details); the app does not offer resend.
- Personal access tokens skip 2FA, and the DDP login uses the resume token from the REST login, so no 2FA there.
- Verified only against a local fake server (required, then invalid, then valid code: 3 requests, the last carries the code and password; a non-2FA failure is rethrown). Not exercised against a real 2FA account or open.rocket.chat.

## Chat with Fuselage components

The chat screens have two versions, picked when Metro starts: `EXPO_PUBLIC_CHAT_UI=plain` keeps the React Native and Tamagui-only screens (`src/Login.tsx`, `Rooms.tsx`, `Room.tsx`); anything else, the default, renders Fuselage (`src/fuselage/`). Both read the same state from `useLogin`, `useRooms` and `useRoom`, and the same `api.ts`. Each version is loaded with `require` from `App.tsx`, because each creates its own Tamagui config and only one may exist; the Fuselage one mounts `FuselageProvider` (config plus the icon font, as the gallery does). `EXPO_PUBLIC_GALLERY=1` or `EXPO_PUBLIC_SWEEP=1` select the plain screens, since the gallery and the sweep open from the plain login.

Dev only: `EXPO_PUBLIC_CHAT_MOCK=1` feeds invented rooms and messages (`src/mockData.ts`) to the same components, and a login with any text succeeds without a network call; `EXPO_PUBLIC_CHAT_MOCK=rooms` or `=room` also starts past the login, because there is no touch tool. Screenshots in `docs/chat/` use this data only: `login-`, `rooms-` and `room-plain-vs-fuselage.png` (plain left, Fuselage right). The login shot has a fake password typed in to show the masking.

What renders in the Fuselage version: `SidebarItem` rows with `SidebarItemIcon`, `SidebarItemContent`/`Title` and `SidebarItemBadge` for the rooms; `Message`, `MessageContainer`, `MessageHeader`, `MessageName`, `MessageUsername`, `MessageTimestamp` and `MessageBody` for each message (no `Avatar`: it still throws); `Button`, `Field`, `FieldLabel`, `FieldRow`, `UrlInput`, `TextInput`, `PasswordInput` and `ToggleSwitch` on the login and the composer; `Tag` marks private rooms in the room list.

Looks different from the plain version, or wrong:

- Icons come from the Rocket.Chat font (hash, lock, at) where the plain rows have `#`, `P`, `@` text; the badge replaces `(3)`.
- A long room name truncates with an ellipsis in one line; the plain row wraps it onto two lines. The badge of `120` is cut to `1...` because the badge is the one that shrinks.
- A read room is gray, an unread one black: the `highlighted` look, absent in the plain list. Rows have no divider and are visibly denser than the plain ones.
- Messages show the display name, `@username` and `HH:MM` (the plain rows show `HH:MM:SS`); the body wraps at the web's line height, and the content is inset further from the edge than the plain rows.
- A `Button` takes the whole width of a row on native (it is not given `width: fit-content`), so each one in a row is wrapped in a fixed 96 px box (`Fit`); in a column it is full width, which looks like a primary action and is fine for Sign in.
- `UrlInput`, `TextInput`, `PasswordInput` and the composer still draw no border or background on native (checked at step 2: the input chrome has not landed, `InputBox` is still a Box with SCSS); each is wrapped in a bordered `View` in the app. That is a workaround for a missing look, not Fuselage styling.
- `ToggleSwitch` draws a track and a thumb since step 2 (the native twin: blue when checked, light when disabled; gallery cell `ToggleSwitch`); its `onChange` was not exercised (no touch tool), and the twin is not verified by its author either.
- The placeholder of the composer input is gray and shows; typing, caret and keyboard were not exercised (no keyboard tool).

What stays plain, and why:

- The password and token field is a React Native `TextInput` with `secureTextEntry` again. At step 2 `PasswordInput` does mask (`type='password'` is `secureTextEntry`; `EXPO_PUBLIC_CHAT_PASSWORD=fuselage` shows it in the login), but the input does not take focus: it is a bare `TextInput` in an unstyled wrapper and collapses to the caret width, so a tap misses it; its eye is an `onClick` on an `Icon`, not a press (probe: `Icon[onClick]` only), and the addon is laid out before the input. Do not ship it on native until the input chrome and the addon layout land.
- The screen titles and the live indicator are `Text` of React Native: Fuselage has no title component without the web's `h1`/`h2` tags.
- The gallery and the sweep, reachable from the plain login only.

`onChange` of the Fuselage inputs receives the string on native, the event on the web; the screens take `String(value)`.

Press: `src/GalleryContent.tsx` has a dev probe (cell "Press attach probe", `EXPO_PUBLIC_GALLERY=1 EXPO_PUBLIC_GALLERY_ONLY=Press`) that walks the fibers under `Button`, `Chip`, `Item`, `SidebarItem` and `Message` and lists those carrying a press prop. On the simulator each one shows `onPress` on the Fuselage component, on the Tamagui `View` and `onClick`, `onResponderRelease`, `onStartShouldSetResponder` on the host `RCTView`; the control `View` with no handler shows none (`docs/chat/press-probe.png`). A real touch was not made.

## Evolution

The branch is updated as the native-enabling work lands; `NATIVE-SWEEP.md` has the table of sweep counts per step and `MERGE-NOTES.md` what each update took. Step 2 added the input props (password is `secureTextEntry`), the `ToggleSwitch` twin and `Tag` as a frame; the app changes of that step are four commits: `use the Fuselage PasswordInput in the login`, `keep the React Native password field by default` (the Fuselage one cannot be focused), `show Tag, ToggleSwitch and the password eye in the gallery`, `tag private rooms in the room list`. New screenshots with mock data: `docs/chat/rooms-plain-vs-fuselage-v2.png` and `room-plain-vs-fuselage-v2.png`. There is no login shot for this step: the simulator's login form holds stored real values, which are not committed; the login evidence is the gallery probe and the notes above.
