# `@rocket.chat/storybook-dark-mode`

> A Storybook addon that toggles the Storybook UI between light and dark themes and tells your stories which one is active.

[![npm](https://img.shields.io/npm/v/@rocket.chat/storybook-dark-mode?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/storybook-dark-mode) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/storybook-dark-mode?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/storybook-dark-mode)

This is Rocket.Chat's fork of [`storybook-dark-mode`](https://github.com/hipstersmoothie/storybook-dark-mode) by Andrew Lisowski. It keeps the original addon's behavior and parameters, and is maintained for the Storybook version Rocket.Chat uses: it imports from Storybook 9's `storybook/*` entry points and is built against React 19. Rocket.Chat's own Storybooks use it to switch Fuselage components between light and dark palettes.

The addon:

- adds a sun/moon button to the Storybook toolbar;
- applies a light or dark theme to the Storybook UI, and optionally adds a class to the preview;
- follows the system `prefers-color-scheme` until the user picks a mode, then remembers that choice in `localStorage`;
- exposes a `useDarkMode` hook and channel events, so stories can render in the matching theme.

## Installation

```sh
npm install --save-dev @rocket.chat/storybook-dark-mode storybook@9 react react-dom
```

Peer dependencies: `storybook` 9 (`^9.0.0`), `react` and `react-dom`.

## Usage

### Register the addon

Add the package to the `addons` list in `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.tsx'],
	addons: ['@rocket.chat/storybook-dark-mode'],
	framework: '@storybook/react-webpack5',
};

export default config;
```

The toolbar button appears in both story and docs view.

### Configure the themes

Set the `darkMode` parameter in `.storybook/preview.tsx`:

```tsx
import type { Preview } from '@storybook/react-webpack5';
import { themes } from 'storybook/theming';

export default {
	parameters: {
		darkMode: {
			dark: { ...themes.dark, appBg: '#1f2329' },
			light: { ...themes.normal },
			current: 'light',
		},
	},
} satisfies Preview;
```

### Theme your stories

`useDarkMode` returns `true` while dark mode is on and re-renders when it changes. Use it in a decorator to switch your own theme:

```tsx
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';

export default {
	decorators: [
		(Story) => {
			const dark = useDarkMode();

			return (
				<ThemeProvider theme={dark ? 'dark' : 'light'}>
					<Story />
				</ThemeProvider>
			);
		},
	],
} satisfies Preview;
```

`ThemeProvider` stands in for your own theming component.

### Style the preview with a CSS class

With `stylePreview: true`, the addon adds `darkClass` or `lightClass` to the `classTarget` element inside the preview iframe:

```ts
export default {
	parameters: {
		darkMode: {
			stylePreview: true,
			classTarget: 'html',
			darkClass: 'theme-dark',
			lightClass: 'theme-light',
		},
	},
} satisfies Preview;
```

### Listen to channel events

The addon emits `DARK_MODE_EVENT_NAME` with a boolean each time the mode is applied. Emit `UPDATE_DARK_MODE_EVENT_NAME` to change the mode from elsewhere: pass `'dark'` or `'light'`, or nothing to toggle.

```ts
import { DARK_MODE_EVENT_NAME, UPDATE_DARK_MODE_EVENT_NAME } from '@rocket.chat/storybook-dark-mode';
import { addons } from 'storybook/preview-api';

const channel = addons.getChannel();

channel.on(DARK_MODE_EVENT_NAME, (isDark: boolean) => {
	console.log(isDark ? 'dark' : 'light');
});

channel.emit(UPDATE_DARK_MODE_EVENT_NAME, 'dark');
```

## API

### `darkMode` parameters

| Parameter      | Type                 | Default        | Description                                              |
| -------------- | -------------------- | -------------- | -------------------------------------------------------- |
| `dark`         | `ThemeVars`          | `themes.dark`  | Storybook theme used in dark mode.                       |
| `light`        | `ThemeVars`          | `themes.light` | Storybook theme used in light mode.                      |
| `current`      | `'light' \| 'dark'`  | —              | Initial mode. When unset, the system preference decides. |
| `stylePreview` | `boolean`            | `false`        | Also add the mode class to the preview iframe.           |
| `classTarget`  | `string`             | `'body'`       | CSS selector of the element that receives the class.     |
| `darkClass`    | `string \| string[]` | `['dark']`     | Class or classes added in dark mode.                     |
| `lightClass`   | `string \| string[]` | `['light']`    | Class or classes added in light mode.                    |

A mode picked with the toolbar button takes precedence over `current` and the system preference.

### Exports

| Export                        | Description                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `useDarkMode(): boolean`      | Hook for the preview (decorators and stories). `true` while dark mode is on.          |
| `DARK_MODE_EVENT_NAME`        | `'DARK_MODE'`. Emitted with `isDark: boolean` whenever the mode is applied.           |
| `UPDATE_DARK_MODE_EVENT_NAME` | `'UPDATE_DARK_MODE'`. Emit it with `'dark'`, `'light'` or nothing to change the mode. |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/storybook-dark-mode). From the repository root:

```sh
yarn workspace @rocket.chat/storybook-dark-mode build
yarn workspace @rocket.chat/storybook-dark-mode typecheck
yarn workspace @rocket.chat/storybook-dark-mode lint
```

## License

MIT — see [LICENSE](LICENSE). Copyright Andrew Lisowski and Rocket.Chat Technologies Corp.
