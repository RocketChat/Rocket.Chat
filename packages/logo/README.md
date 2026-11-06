# `@rocket.chat/logo`

> The Rocket.Chat logo as React components, plus prebuilt SVG and PNG files.

[![npm](https://img.shields.io/npm/v/@rocket.chat/logo?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/logo) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/logo?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/logo)

This package renders the horizontal Rocket.Chat logo (symbol and wordmark) as an inline SVG. It is used by Rocket.Chat's layout and onboarding screens.

- `RocketChatLogo` renders the logo in a single color, red by default.
- `TaggedRocketChatLogo` renders the logo next to an optional pill-shaped tag, such as an edition name.
- `dist/logo.svg` and `dist/logo.png` are static copies of the default logo for places where React is not available.

## Installation

```sh
npm install @rocket.chat/logo react react-dom
```

`react` and `react-dom` are peer dependencies. The components use `useId`, so React 18 or later is required. The package ships both CommonJS and ES modules, with TypeScript declarations.

## Usage

### Plain logo

```tsx
import { RocketChatLogo } from '@rocket.chat/logo';

const Header = () => (
	<div style={{ width: 224 }}>
		<RocketChatLogo />
	</div>
);
```

The SVG fills its container (`width` and `height` are `100%`) and keeps its aspect ratio, so size it through the parent element. It has an accessible title, "Rocket.Chat".

Pass `color` to change the fill:

```tsx
<RocketChatLogo color='#ffffff' />
<RocketChatLogo color='currentColor' />
```

### Logo with a tag

```tsx
import { TaggedRocketChatLogo } from '@rocket.chat/logo';

const Header = () => (
	<div style={{ width: 224 }}>
		<TaggedRocketChatLogo tagTitle='Enterprise' />
	</div>
);
```

The tag only renders when `tagTitle` is set. Extra props are passed to the wrapping `<div>`.

### Static files

The build also writes the default red logo to:

- `@rocket.chat/logo/dist/logo.svg`
- `@rocket.chat/logo/dist/logo.png` (1000 px wide)

These are files on disk, not URLs your app serves. With a bundler that handles asset imports, import the file to get a URL:

```tsx
import logoUrl from '@rocket.chat/logo/dist/logo.svg';

const Logo = () => <img src={logoUrl} alt='Rocket.Chat' />;
```

Without one, copy the file into a directory your server publishes and point `src` at its URL there.

## API

### `RocketChatLogo`

| Prop    | Type     | Default                     | Description                   |
| ------- | -------- | --------------------------- | ----------------------------- |
| `color` | `string` | `#F5455C` (Fuselage `r400`) | Fill color of the whole logo. |

### `TaggedRocketChatLogo`

Accepts every `<div>` attribute, plus:

| Prop            | Type     | Default                     | Description                                       |
| --------------- | -------- | --------------------------- | ------------------------------------------------- |
| `tagTitle`      | `string` | —                           | Text of the tag. Without it, no tag is rendered.  |
| `tagBackground` | `string` | `#F5455C` (Fuselage `r400`) | Background color of the tag.                      |
| `color`         | `string` | Fuselage `white`            | Text color of the tag. The logo itself stays red. |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/logo). From the repository root:

```sh
yarn workspace @rocket.chat/logo build
yarn workspace @rocket.chat/logo testunit
yarn workspace @rocket.chat/logo typecheck
yarn workspace @rocket.chat/logo lint
```

`build` compiles the ES and CommonJS outputs, then renders the default logo to `dist/logo.svg` and `dist/logo.png`.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
