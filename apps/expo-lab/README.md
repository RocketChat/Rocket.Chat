# Expo lab

A React Native (Expo) app used as a **test bed** for running `@rocket.chat/fuselage` natively. It is not a product and nothing ships from it.

It answers one question: what does each Fuselage component do when it is mounted in React Native? Components that are still SCSS plus `Box` throw on a DOM tag when mounted natively; as components move to the shared Tamagui frames, the same lab shows them starting to render, without changing the lab.

It is not built or run in CI: only its `typecheck` script is picked up by `yarn turbo run typecheck`.

## What is in it

| Screen | Where | What it shows |
| --- | --- | --- |
| Component sweep | `src/Sweep.tsx`, `src/SweepRow.tsx`, `src/sweepCases.tsx` | Mounts every component exported by `@rocket.chat/fuselage` once, each inside an error boundary, and reports renders, throws, needs-context or empty |
| Gallery | `src/Gallery.tsx`, `src/GalleryContent.tsx` | A hand-picked set of components with realistic props, to look at and press |

Mock avatars are generated images embedded in `src/avatars.ts`; the lab makes no network request.

## Baseline for `develop`

This repository does not store a table of results: it would go stale with every conversion pull request. The baseline for `develop` is produced by running the sweep, on a simulator with the current checkout:

```sh
yarn workspace @rocket.chat/expo-lab sweep --out sweep-results.md
```

The command starts Metro with the sweep as the first screen and a local receiver for the app's report. Open the app on a booted simulator or emulator (see Run below) and wait about a minute; the table is written when the sweep ends and the command exits. Each row is a component with its status (`renders`, `empty`, `throws`, `needs-context`), laid-out size and the first line of the error. Run it on `develop` and on a branch to compare the two. `--platform android` makes the app reach the receiver through the emulator's host address, `--port` and `--metro-port` change the receiver's and Metro's ports, and `--open` also asks the booted iOS simulator to open the installed dev client.

## How it uses Fuselage

`metro.config.js` is the mechanism, and it applies to native only:

- `@rocket.chat/fuselage` resolves to the **source** `packages/fuselage/src/index.runtime.ts`, not to `dist`. Editing a component under `packages/fuselage/src` reloads in the app. `packages/fuselage` is added to `watchFolders`.
- `*.css` and `*.scss` imports resolve to an empty module (`stubs/empty.js`). The web CSS is not available natively, which is the point of the baseline.
- `react`, `react-dom`, `react-native` and `scheduler` always resolve from the lab, so the monorepo's hoisted React and Expo's pinned React never both load.
- `@tamagui/web` resolves to a single copy.
- `src/FuselageHost.tsx` imports the shared Tamagui config from `packages/fuselage/src/tamagui.config` and the icon font from `packages/icons/dist/font/rocketchat.ttf`, so `@rocket.chat/icons` must be built.

`src/pressProps.d.ts` adds `onPress` to React's `HTMLAttributes` for this app only. Components that are still web-only type their props from the DOM and would otherwise reject the native press handler the gallery passes; once a component declares `onPress` itself the augmentation is harmless.

## Prerequisites

- Node and Yarn as in the repository root (`yarn install`).
- Build the workspace dependencies once: `yarn turbo run build --filter=@rocket.chat/expo-lab...`.
- iOS: macOS with Xcode, an iOS simulator and CocoaPods. Android: Android Studio, an emulator and a JDK. The app runs in a **development client**, not Expo Go.

## Run

```sh
yarn workspace @rocket.chat/expo-lab ios       # prebuilds the native project (git-ignored) and installs the dev client
yarn workspace @rocket.chat/expo-lab android
yarn workspace @rocket.chat/expo-lab start     # Metro for an already installed dev client
yarn workspace @rocket.chat/expo-lab sweep     # sweep and write the markdown table
yarn workspace @rocket.chat/expo-lab typecheck
```

To check that the JavaScript bundles without a simulator: `cd apps/expo-lab && npx expo export --platform ios --output-dir <tmp>`.

Dev switches are `EXPO_PUBLIC_*` variables read at bundle time:

| Variable | Effect |
| --- | --- |
| `EXPO_PUBLIC_SWEEP=1` | Open the component sweep instead of the home screen |
| `EXPO_PUBLIC_SWEEP_SINK=<url>` | Where the sweep POSTs its results as JSON (set by `yarn sweep`) |
| `EXPO_PUBLIC_GALLERY_ONLY=Item,NavBar` | Show only the gallery cells whose name contains one of these |

## How the sweep works

`src/Sweep.tsx` reads the runtime exports of `@rocket.chat/fuselage` (capitalised keys that are components), then mounts them one at a time, every 150 ms, each inside its own error boundary (`src/SweepRow.tsx`). A wrapper `View` measures the laid-out size, so a component that mounts but draws nothing is reported as `empty`. A component that draws nothing with a string child is retried once with a `Text` child. Errors are shown per component with the first line of the message, and an error thrown from a timer is attributed to the component being mounted.

The screen only observes mounting and layout. Nothing is pressed or typed.

### Adding a component to the sweep

New Fuselage exports are picked up automatically. Add an entry to `cases` in `src/sweepCases.tsx` only when a component needs props or a context to mount:

```tsx
Icon: { props: { name: 'bell', size: 'x24' }, children: undefined },
Field: { children: <FieldLabel>Label</FieldLabel> },
Thing: { render: () => <Thing><ThingPart /></Thing> },
```

`props` are spread on the component, `children` replaces the default string child, `render` replaces the whole mount for components that need a specific tree, and `context: '<what it needs>'` reports the component as "needs context" without mounting it. A component without an entry gets its own name as a string child. To look at it by hand, add a cell to `src/GalleryContent.tsx`.

## Roadmap

This lab is deliberately small. Screens built from Fuselage over real data (a login, a room list and a room, the message composer, UiKit blocks rendered natively, a session store backed by the platform Keychain) were tried in an earlier version and will come back as separate pull requests. No date is promised.
