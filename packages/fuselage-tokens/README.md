# `@rocket.chat/fuselage-tokens`

> Design tokens for Fuselage, Rocket.Chat's design system, as JSON and SCSS.

[![npm](https://img.shields.io/npm/v/@rocket.chat/fuselage-tokens?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-tokens) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage-tokens?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-tokens)

The colors, typography, breakpoints, border and spacing values that Fuselage and the Rocket.Chat clients are styled with. They are defined once and built with [Style Dictionary](https://styledictionary.com/) into JSON files (with TypeScript declarations) and SCSS maps.

Use this package when you need Rocket.Chat's design values outside of Fuselage's React components: charts, emails, PDFs, native code, or your own stylesheets. If you use `@rocket.chat/fuselage`, its `Box` props and `Palette` already read from these tokens.

## Installation

```sh
npm install @rocket.chat/fuselage-tokens
```

The package has no dependencies and no JavaScript entry point. Import the files under `dist/` directly.

## Usage

### JavaScript and TypeScript

Each token category is a JSON file:

```ts
import breakpoints from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import typography from '@rocket.chat/fuselage-tokens/dist/typography.json';

colors.n900; // '#…', the darkest neutral
typography.fontScale.h1; // { fontSize: 32, fontWeight: 700, letterSpacing: 0, lineHeight: 40 }
breakpoints.md.minViewportWidth; // 768
```

In Node.js ES modules, add the import attribute: `import colors from '@rocket.chat/fuselage-tokens/dist/colors.json' with { type: 'json' };`.

TypeScript resolves the types through `resolveJsonModule`. Each file also has a `<name>.d.json.ts` declaration next to it, which TypeScript uses when `allowArbitraryExtensions` is enabled.

Theme-aware categories have one object per theme:

```ts
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';

const background = surface.dark.room;
```

### SCSS

Each category is also a flat Sass map, with keys made from the token path in kebab case:

```scss
@use 'sass:map';
@use '@rocket.chat/fuselage-tokens/dist/breakpoints.scss';
@use '@rocket.chat/fuselage-tokens/dist/colors.scss';

.sidebar {
	color: map.get(colors.$colors, 'n900');

	@media (min-width: map.get(breakpoints.$breakpoints, 'md-min-viewport-width')) {
		padding-inline: map.get(breakpoints.$breakpoints, 'md-gutter-width');
	}
}
```

The map is named after the category in kebab case: `$colors`, `$surface`, `$status-bullet`, and so on. Add `node_modules` to your Sass load paths (or let your bundler resolve package imports) for the `@use` paths above to work.

## API

Every category is available as `dist/<category>.json`, `dist/<category>.d.json.ts` and `dist/<category>.scss`.

| Category       | Contents                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`       | The base palette: `white` and graded scales for neutral (`n100`–`n900`), red (`r`), orange (`o`), purple (`p`), yellow (`y`), green (`g`) and blue (`b`). |
| `surface`      | Background colors (`light`, `tint`, `room`, `hover`, `selected`, `sidebar`…).                                                                             |
| `font`         | Text and icon colors (`default`, `titlesLabels`, `hint`, `info`, `danger`…).                                                                              |
| `stroke`       | Border colors (`extraLight`, `light`, `medium`, `dark`, `highlight`, `error`…).                                                                           |
| `status`       | Status backgrounds and the text color to use on each (`info`, `font-on-info`, `success`, `danger`, `warning`, `service-1`…).                              |
| `statusBullet` | User presence colors (`online`, `away`, `busy`, `disabled`, `offline`, `loading`).                                                                        |
| `badge`        | Badge backgrounds (`level-0` to `level-4`).                                                                                                               |
| `button`       | Button background and text colors per variant and state.                                                                                                  |
| `shadow`       | Shadow colors (`highlight`, `danger`, `elevation-1`…).                                                                                                    |
| `typography`   | `fontFamily` (`sans`, `mono`) and `fontScale` (`hero`, `h1`–`h5`, `p1`, `p1m`, `p1b`, `p2`, `p2m`, `p2b`, `c1`, `c2`, `micro`).                           |
| `breakpoints`  | `xs`, `sm`, `md`, `lg`, `xl`, `xxl` and `xxxl`, each with `minViewportWidth`, `columns` and `gutterWidth`.                                                |
| `border`       | `radius` (`none`, `default`, `small`, `medium`, `large`, `extra-large`, `full`) and `width` (`none`, `default`, `medium`, `large`, `extra-large`).        |
| `spacing`      | The spacing scale for margins, paddings and gaps: `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32` and `x40`. The SCSS map holds them in `px`.               |

`surface`, `font`, `stroke`, `status`, `statusBullet`, `badge`, `button` and `shadow` are split by theme: `light`, `dark` and `high-contrast`.

In the JSON files, sizes are plain numbers in pixels and colors are hex strings.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage-tokens). From the repository root:

```sh
yarn workspace @rocket.chat/fuselage-tokens build
yarn workspace @rocket.chat/fuselage-tokens lint
yarn workspace @rocket.chat/fuselage-tokens lint:fix
```

Token sources live in `src/` as Style Dictionary JSON. `build.js` and `config.js` define the transforms and output formats.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
