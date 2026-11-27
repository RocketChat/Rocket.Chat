# expo-lab

Sandbox Expo app to try Tamagui, the Rocket.Chat SDK packages and `@rocket.chat/fuselage` in React Native.

`App.tsx` is a chat prototype on the SDK packages (no Fuselage): log in to a server you type, list rooms, open a room, see live messages, send. Files: `src/session.ts` (login, `DDPSDK`), `src/twoFactor.ts`, `src/api.ts` (rooms, history, send), `src/Login.tsx`, `src/Rooms.tsx`, `src/Room.tsx`. The session is kept in the Keychain between launches (see Session persistence).
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
| `Avatar` | not converted at step 1; renders since step 3 | see the step 3 note below | n/a | n/a | `Invariant Violation: View config getter callback for component 'img' must be a function` at `Avatar.tsx:23` (`<img>`). Same error inside `Message` when it holds an `Avatar` (`AvatarContainer.tsx:9`). |
| `Banner` | not converted at step 1; renders since step 3 (title and body sit on one line) | n/a | n/a | n/a | Same invariant for `h6` (`Banner.tsx:87`). |
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

What renders in the Fuselage version: `SidebarItem` rows with a `SidebarItemAvatarWrapper` around an `Avatar`, `SidebarItemIcon`, `SidebarItemContent`/`Title` and `SidebarItemBadge` for the rooms; `Message`, `MessageContainer`, `MessageHeader`, `MessageName`, `MessageUsername`, `MessageTimestamp` and `MessageBody` for each message and an `Avatar` in a `MessageLeftContainer`; `Button`, `Field`, `FieldLabel`, `FieldRow`, `UrlInput`, `TextInput`, `PasswordInput` and `ToggleSwitch` on the login and the composer; `Tag` marks private rooms in the room list.

Looks different from the plain version, or wrong:

- Icons come from the Rocket.Chat font (hash, lock, at) where the plain rows have `#`, `P`, `@` text; the badge replaces `(3)`.
- A long room name truncates with an ellipsis in one line; the plain row wraps it onto two lines. The badge of `120` is cut to `1...` because the badge is the one that shrinks.
- A read room is gray, an unread one black: the `highlighted` look, absent in the plain list. Rows have no divider and are visibly denser than the plain ones.
- Messages show the display name, `@username` and `HH:MM` (the plain rows show `HH:MM:SS`); the body wraps at the web's line height, and the content is inset further from the edge than the plain rows.
- A `Button` takes the whole width of a row on native (it is not given `width: fit-content`), so each one in a row is wrapped in a fixed 96 px box (`Fit`); in a column it is full width, which looks like a primary action and is fine for Sign in.
- `UrlInput`, `TextInput`, `PasswordInput` and the composer still draw no border or background on native (checked at step 2: the input chrome has not landed, `InputBox` is still a Box with SCSS); each is wrapped in a bordered `View` in the app. That is a workaround for a missing look, not Fuselage styling.
- Avatars (step 3): `Avatar` and `Banner` render natively (the gallery cells `Avatar` and `Banner`). The image is a React Native `Image`, so a PNG or JPEG URL loads (a remote PNG and a data URI were checked on the simulator) but an SVG does not: the server serves its default avatars (`/avatar/<username>`, `/avatar/room/<rid>`) as `image/svg+xml`, so against a real server only uploaded avatars will show and the rest are blank until an SVG renderer is added. In mock mode a bundled colored placeholder stands in for the server. Not checked: a real server's avatars.
- Default avatars (step 4): `src/AppAvatar.tsx` solves the SVG limitation in the app, without touching Fuselage. The REST data has no usable signal (`subscriptions.get` carries no room `avatarETag`, a message's `u` is only `_id`, `username`, `name`), so it sends one `HEAD` to the avatar URL, cached per URL, and takes `image/svg+xml` as a default avatar: drawn by `SvgUri` in an `AvatarContainer` of the same size with a 4px radius (full when `rounded`); any other type, a `data:` URL or a failed `HEAD` renders the Fuselage `Avatar`. A 404 or offline shows an empty frame, nothing throws; a failed `HEAD` stays cached for the session. Mock mode keeps the PNG data URIs, except `general` and `ada.lovelace`, which use the public default avatars (`docs/chat/rooms-svg-avatars-v4.png`, `room-svg-avatars-v4.png`). Not checked: a real server's list (needs a login). Remaining: avatars of rooms and users with an `avatarETag` could skip the `HEAD`, once the data carries it (`users.info`).
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

- Avatar alignment (step 5, `5ea43b1cd40`): the tiles were square (36pt) and the row (44pt, icon at x=54, title at x=76) already matched the web to the pixel, but the letter of a default avatar sat 6.8pt right of center (margins 18.3 left, 4.7 right, against 11.7 and 10.7 on the web): the server's SVG puts the letter in whitespace inside `<text>`, which `SvgUri` draws as an advance before the centered text. `AppAvatar` now loads the SVG with one `GET` per URL (no `HEAD`), trims the whitespace between tags and draws it with `SvgXml` (margins 12.0 and 11.0). In a message the web centers the avatar on the header and first body line through a 40px `min-block-size` in `Messages.styles.scss`, which native does not run, so the avatar sat 2pt too high; `FuselageRoom` wraps it in a 40pt centered view. Upstream, not done here: that min-height belongs to `MessageLeftContainer` (`packages/fuselage/src/components/Message/MessageLeftContainer.tsx`, #43706). Evidence: `docs/chat/avatar-align-before.png`, `avatar-align-after.png`, `avatar-align-web.png` (rooms) and `avatar-align-room-before.png`, `avatar-align-room-after.png` (messages), mock data only.
- Avatar formats (step 6, `fe9b586a3ab`): the report was that avatars only render when they are SVG. On the simulator `AppAvatar` drew every non-SVG case: a remote PNG (transparent logo), the same PNG with `?etag=abc`, two remote JPEGs, and `data:` PNG and JPEG with visible content, at x36 and x24, square and rounded (gallery cell `AppAvatar formats`, `docs/chat/avatar-formats-before.png`; no code change was needed, so there is no "after"). What looked broken in mock mode was the data: the old placeholders were solid squares with no letter. `mockAvatar` now returns a letter PNG per name (`src/mockAvatars.ts`, generated once with a 5x7 pixel font, no dependency), keeps two solid squares (`design-review`, `launch-team`) as plain uploads and the two public SVG defaults (`docs/chat/avatar-mock-rooms-after.png`, `avatar-mock-room-after.png`). Not verified: uploaded avatars from a real server (needs a login); the path is the same `fetch` then `Avatar` as the remote PNG and JPEG above.

## Message fields (plan step A1)

`ChatMessage` (`src/api.ts`) is typed from `IMessage` with `import type` from `@rocket.chat/core-typings` (erased at build, so no runtime Ajv schema reaches Metro), with each `Date` turned into an ISO string. Read from code, not observed against a live server: `channels.history`, `groups.history` and `im.history`/`dm.history` all call `getChannelHistory` (`apps/meteor/server/meteor-methods/messages/getChannelHistory.ts`), which returns whole message documents from `Messages.findVisibleByRoom...` (no projection; `u` is cut to `_id`, `username`, `name` by `keepPublicAuthorFields`, `starred` is filtered to the caller) as `{ messages, firstUnread?, unreadNotLoaded? }`, newest first. So every `IMessage` field stored on the document comes back: `_id`, `rid`, `msg`, `ts`, `_updatedAt`, `u`, `md`, `attachments`, `reactions`, `mentions`, `channels`, `urls`, `tmid`, `tshow`, `tcount`, `tlm`, `t`, `groupable`, `emoji`, `alias`, `avatar`, `editedAt`, `editedBy`, `pinned`, `starred`, `blocks`, `files`, `e2e`/`content` and the rest. `chat.syncMessages` returns `{ result: { updated: IMessage[], deleted: { _id, _deletedAt }[], cursor? } }`, the same documents, plus the deleted ids: usable for an incremental refresh later. `ChatMessage` carries `_id`, `rid`, `msg`, `ts`, `_updatedAt`, `u` and, optional, `md`, `attachments`, `reactions`, `mentions`, `channels`, `urls`, `tmid`, `tcount`, `tlm`, `t`, `groupable`, `emoji`, `alias`, `avatar`, `editedAt`, `editedBy`; `blocks`, `files`, `pinned`, `starred`, `e2e` stay out until a component needs them. The mock messages carry `md` (the output of the parser for bold, italic, inline code, link, user and channel mention, list and quote), reactions, one attachment, mentions, channels and an edit.

## Plan steps A1 and A2: results

- A1 (`af97c5798c6`): `ChatMessage` carries the web message fields; the mock has real parser output, reactions, an attachment and an edit. The endpoint fields are read from code (see "Message fields"), not observed against a live server.
- A2: `@rocket.chat/message-parser` bundles under Metro and runs on Hermes as is: no `metro.config.js` change, no polyfill, no package change (its `dist/messageParser.js` was already built; the `exports` entry resolves with `unstable_enablePackageExports`). Gallery cell `message-parser AST` (`EXPO_PUBLIC_GALLERY=1 EXPO_PUBLIC_GALLERY_ONLY=message-parser`) prints the parse of four sample strings, for example `PARAGRAPH > PLAIN_TEXT, BOLD > PLAIN_TEXT, ITALIC, INLINE_CODE`, `UNORDERED_LIST > LIST_ITEM`, `QUOTE`, `EMOJI` (`docs/chat/message-parser-ast.png`, sample strings only). The cell does not descend into `LINK`, whose value is `{ src, label }` rather than a node.
- Sweep counts: unchanged, no components were added or converted, so `NATIVE-SWEEP.md` has no new row.

## Plan steps A3 and A4: native markup and emoji

`src/markup/` renders the message-parser `Root` with React Native `Text` and `View` only (no gazzodown, no DOM tags, no new dependency): `Markup.tsx` (blocks), `Inline.tsx` (inlines, mention and link handling), `Emoji.tsx`, `theme.ts` (the Fuselage message body values as plain numbers and colors: 14/20, `#2f343d`, link `#095ad2`). `FuselageRoom` renders `message.md` through `Markup` and falls back to `MessageBody` with `msg` when `md` is missing; the plain UI is untouched. Gallery cell `Native markup` (`EXPO_PUBLIC_GALLERY=1 EXPO_PUBLIC_GALLERY_ONLY="Native markup"`) shows the mock ASTs, `parse()` of sample strings and edge cases; `EXPO_PUBLIC_CHAT_MOCK=room` shows the formatted mock messages (`docs/chat/markup-gallery.png`, `markup-room.png`, mock data only).

Props: `Markup` takes `{ md, msg?, mentions?, channels?, searchText?, onMention? }` (the first five are `MessageMarkupProps` of the message list; `searchText` is accepted and unused). `Emoji.tsx` also exports `MessageEmoji` with `MessageEmojiProps` (`emojiHandle`, `className?`, `fillContainer?`; the last two are ignored). `Emoji` resolves custom emoji through one function, `resolveEmoji(shortCode, serverUrl)`: a small built-in name to unicode map (a real emoji pack replaces it), then `${server}/emoji-custom/<name>.png` as an `Image` when `EmojiServerContext` has a server (the room provides `session.serverUrl`, none in mock mode), otherwise, or when the image fails, `:name:` (or the typed ascii form). The big size (36pt text, 40pt image) is used for `BIG_EMOJI`.

| Node | State | How |
| --- | --- | --- |
| PARAGRAPH, PLAIN_TEXT | supported | nested `Text`, lines wrap |
| BOLD, ITALIC, STRIKE | supported | nested `Text` styles, nest freely |
| INLINE_CODE | supported | monospace on a gray background |
| CODE (block) | supported | monospace `View` in a horizontal `ScrollView`; no highlighting, language ignored |
| LINK | supported | `Text` opening with `Linking` (`javascript:`, `data:`, `vbscript:` ignored) |
| IMAGE | degraded | shown as a link to its source |
| MENTION_USER, MENTION_CHANNEL | supported | styled `Text`, `onMention({ kind, name })`; with `mentions`/`channels` given only listed names are styled (as on the web); `@all`/`@here` always |
| QUOTE | supported | left border `View` |
| UNORDERED_LIST, ORDERED_LIST, TASKS | supported | glyph markers (bullet, `n.`, checkbox glyphs, not interactive), nested lists indented |
| HEADING | supported | font size by level (28, 24, 20, 16) |
| SPOILER, SPOILER_BLOCK | supported | tap to reveal |
| COLOR | supported, unverified | swatch glyph plus `rgba(...)`; the parser did not emit it for the samples tried |
| EMOJI, BIG_EMOJI | supported | `Emoji.tsx`; unicode as `Text`, custom as above |
| LINE_BREAK, HORIZONTAL_RULE | supported | spacer, 1px line |
| TIMESTAMP | degraded | formatted with `Intl.DateTimeFormat`; `R` shows a date and time, not a relative one |
| KATEX, INLINE_KATEX | degraded | the source in monospace, marker `[katex: not supported yet]` in dev |
| TABLE | degraded | cells joined with `|` in monospace, marker in dev; cells keep only their text |
| unknown node | degraded | source slice from `fallback` if present, else its text children, else nothing |

Not done: highlight of `searchText`, `onTaskChecked`, `useRealName` and `ownUserId` looks of mentions, `detectEmoji` and `convertAsciiToEmoji`, and the web's `title` hints.

## Session persistence

The signed-in session survives app restarts, so you do not log in every time.

**What is stored.** One Keychain item (`rc-expo-lab.session`) holding `{"v":2,"serverUrl","userId","authToken","kind"}`. After a password login `authToken` is the resume token the server issued and `kind` is `password`. After a personal access token (PAT) login `authToken` is the PAT you typed, as typed, and `kind` is `token`: a PAT is a long-lived credential, and it is stored in the Keychain. The password and a 2FA code are never stored. A `v:1` item (written before `kind` existed, so it could hold either) is read as `kind: unknown` and treated like a PAT. A second item (`rc-expo-lab.last-server`) holds only the server URL, so the login prefills it after sign out.

**Where.** `expo-secure-store` (iOS Keychain), `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`: readable only while the device is unlocked, never synced to iCloud, not migrated to another device. On read the shape is validated (`v` 1 or 2, non-empty strings, a valid `kind` for v2, an anchored `https://host[:port][/path]` URL, or `http` for `localhost`, `127.0.0.1` or `[::1]` only; no userinfo, `?`, `#` or backslash); anything else is deleted. `login()` applies the same URL check (after lowercasing the scheme) and throws before creating an SDK, so it never saves a session the next launch would delete.

**Start-up** (`useRestoreSession` in `src/session.ts`, storage in `src/sessionStore.ts`, shared by the Fuselage and plain UIs):

| State | Meaning | Next |
|---|---|---|
| `restoring` | stored session found, one `GET /v1/me` (plus the DDP connect), 10 s timeout | below |
| `restored` | the server accepted it | rooms screen |
| `rejected` | 401 or 403 | stored session deleted, login with the server URL prefilled |
| `offline` | network error, timeout, any other failure | session kept, "Could not reach the server" with Retry (back to `restoring`) or "Sign in instead" |
| `none` | nothing stored | login |

Sign out (`signOut` in `src/session.ts`) deletes the stored session first and closes the DDP connection. For `kind: password` it also calls `POST /v1/logout` (best effort), revoking the resume token it issued. For `token` and `unknown` it never calls `/v1/logout`: that endpoint removes the token from the user's login tokens, which is where PATs live, so it would permanently revoke a PAT shared with other integrations. To revoke a PAT, do it on the server. If deleting from the Keychain fails, the in-memory session is still cleared and an alert says "Could not clear the saved session". Signing in over a stored `password` session best-effort revokes the old token first (3 s timeout, never blocks the login); a `token` or `unknown` one is left alone. Logs say only "session saved", "session restored", "session rejected (401)"; token values are never logged.

Deviation from the first design: the offline state is a small gate screen in `App.tsx` (message, Retry) rather than a message inside each login screen, so the two UIs share it without duplicating it.

**Native module.** `expo-secure-store` needs a dev client rebuilt with it (`expo run:ios --no-bundler`). On a binary without it the import throws; the store then falls back to memory only (a dev warning is logged) and the app keeps working.

**Dev switches.**
- `EXPO_PUBLIC_SESSION_STORE=off`: no reads or writes (clean login for screenshots).
- `EXPO_PUBLIC_CHAT_MOCK`: never reads or writes the store.
- `EXPO_PUBLIC_SESSION_LAB=1`: `src/SessionLab.tsx` runs the store and the restore state machine against fake values and an unrelated key (`rc-expo-lab.lab-session`), cleaning up after itself. Screenshots: `docs/session/` (`session-lab-keychain.jpg` with the module, `session-lab-fallback.jpg` with it missing; the one FAIL there is the "available" probe, expected).

**Clearing it.** Sign out is the only reliable clear (and for a PAT, revoke it server-side if needed). On a physical iPhone iOS keeps Keychain items after the app is deleted, so a reinstall can find the old session. The simulator behaves differently: `xcrun simctl uninstall <udid> chat.rocket.expolab` removes it.

**Known limits.**
- Restore and login close the SDK on failure, timeout or a late success; a resume that never settles keeps its socket attempt until it fails.
- Tokens expire server-side; an expired one lands in `rejected` and you log in again.
- No biometric gate yet before restoring.
- Restore against a real server, the 401 path and the 2FA-then-save path have not been exercised without a real login.
- A 403 from a proxy in front of the server is treated as a refusal: the local copy is deleted without the token being revoked.
- The login body (password, 2FA code) is resent by iOS on 307/308 redirects. Android was not assessed; OkHttp keeps custom headers (`X-Auth-Token`) on cross-host redirects.
- Recommended change in `packages/ddp-client` (not made here): `Connection.ts` line 110 sets `ssl` with the case-sensitive `url.startsWith('https') || url.startsWith('wss')`, and lines 111-114 strip only lowercase schemes; line 192 then falls back to `ws://` for anything not `ssl`. `Https://host` therefore becomes plaintext `ws://https://host`... The constructor should parse the scheme case-insensitively and throw on an unknown scheme instead of falling back to `ws://`. The app lowercases the scheme and validates it itself in the meantime.
- Lab results: `docs/session/session-lab-hardened.jpg` (53 cases, fake values, no network).

## UiKit step u1: message blocks natively

`src/uikit/` is a hybrid native renderer (decision x7 of the checklist): `NativeSurfaceRenderer` extends `UiKit.SurfaceRenderer` from `@rocket.chat/ui-kit`, one small file per block group in `blocks/`, `context.ts` (`onAction({ appId, blockId, actionId, value })`, surface kind), `payloads.ts` (invented samples). Nothing touches the network: `onAction` is a prop. The gallery cell "UiKit (message blocks)" shows 10 payloads (`EXPO_PUBLIC_GALLERY=1 EXPO_PUBLIC_GALLERY_ONLY=UiKit`), and the mock room (`EXPO_PUBLIC_CHAT_MOCK=room`) carries one message with `blocks` (rendered only in mock mode). Screenshots: `docs/uikit/uikit-message-blocks.png` (top) and `-2.png` (scrolled).

### Coverage (message surface)

| Block or element | Status | Note |
| --- | --- | --- |
| `plain_text`, `mrkdwn` | supported | `mrkdwn` through `message-parser` `parse` and the native `Markup`; in a context block `plain_text` is 12/16 muted, `mrkdwn` keeps the 14/20 body size; `text.i18n` lookup not ported |
| `section` (text, fields) | degraded | fields are two wrapping columns (`flexBasis: 45%`), not CSS grid |
| section accessory `button`, `image` | supported | other accessories show the placeholder |
| `divider`, `header`, `markdown` | supported | header is 16/24 bold as `fontScale h4` |
| `actions` + `button` | supported | hand-styled `Pressable` (Fuselage `Button` is not centred nor coloured by variant natively); "Show more..." after 5 |
| `context` (text, image) | supported | |
| `image` block, image element | supported | RN `Image`, absolute `https` only, falls back to the alt text on error |
| `callout`, `alert` | supported | Fuselage `Callout`; the callout accessory goes through the same element path |
| `input`, `card`, `carousel`, `container`, `context_actions`, `data_table`, `data_visualization`, `file`, `info_card`, `layout`, `plan`, `preview`, `rich_text`, `table`, `task_card`, `video`, `video_conf` | placeholder | dev-only text `not supported yet: <type>`, nothing in release |
| every select, `overflow`, pickers, inputs, `icon_button`, `feedback_buttons`, ... as elements | placeholder | same |
| malformed payloads (null block, non-array fields, bad scheme) | no throw | a block that fails to mount is caught per block, dev placeholder |

### Copied from fuselage-ui-kit

Structure and values, by file (comments in the code name each): `surfaces/FuselageSurfaceRenderer.tsx` (method per type, null outside the BLOCK context), `FuselageMessageSurfaceRenderer.tsx` (message allowlist), `blocks/SectionBlock*.tsx`, `ActionsBlock*.tsx`, `ContextBlock*.tsx`, `ImageBlock.tsx` (360 px cap), `CalloutBlock.tsx`, `AlertBlock.tsx` (level mapping), `HeaderBlock.tsx`, `DividerBlock.tsx`, `MarkdownBlock.tsx`, `elements/ButtonElement.tsx` (`getVariant`), `ImageElement.tsx` (88 and 20 px). Button colours are Fuselage palette values written by hand.

### typia and Metro findings

- `@rocket.chat/ui-kit` has a built `dist` (ESM, `.js` specifiers, `"type": "module"`). Metro resolves it through the workspace link with `unstable_enablePackageExports`; no alias or polyfill was needed.
- `dist` imports `typia` (7 files, validators pre-generated). The app bundle (2693 modules) loads and runs on Hermes on the iPhone 17 Pro simulator with no Metro or Hermes error. No validator (`isModalView` etc.) is called by this renderer, so none was exercised.
- A trap: Metro started with `CI=1` does not watch files, so edits were not served and an old bundle kept failing. Use `CI=1` only for `export`.

### Not verified

Presses (no touch tool; handler wiring only by reading), a comparison with the web Storybook, dark theme, Android, `isSafeUrl` (not called yet). A `{type:'button'}` without `text` draws an empty button; a small image block keeps blank space around it (contain inside the capped box).

u2 needs: the trigger id and `ui.interaction` POST behind `onAction`, `Alert` for `confirm`, `Linking` after `isSafeUrl` for a button `url`, the `notify-user` stream, and `rid`/`mid` passed to a `UiKitMessage` with the stack's prop shape.
