# `@rocket.chat/icons`

> The Rocket.Chat icon set, shipped as an icon font, standalone SVG files, an SVG sprite and a name-to-character map.

[![npm](https://img.shields.io/npm/v/@rocket.chat/icons?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/icons?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons)

This package holds the icons used across Rocket.Chat and the [Fuselage](https://www.npmjs.com/package/@rocket.chat/fuselage) design system. Every icon is drawn once as an SVG and then built into several formats, so you can pick the one that fits your stack.

The package contains no React components. In a React app built on Fuselage, use the `Icon` component from `@rocket.chat/fuselage`, which renders icons from this package's font.

## Installation

```sh
npm install @rocket.chat/icons
```

The package has no dependencies and no peer dependencies. It has no `exports` map, so every file under `dist/` can be imported or referenced by path.

## Usage

### What is in the package

| Path                                            | Content                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `dist/index.js`                                 | CommonJS module. Default export: an object mapping each icon name to its character in the `RocketChat` font. |
| `dist/index.mjs`                                | The same map as an ES module. Not referenced by `package.json`, so import it by path.                        |
| `dist/index.d.ts`                               | Types for the map, plus the `Keys` type (the union of every icon name).                                      |
| `dist/rocketchat.css`                           | An `@font-face` rule that declares the `RocketChat` font family.                                             |
| `dist/font/rocketchat.{woff2,woff,ttf,eot,svg}` | The icon font in each format referenced by `rocketchat.css`.                                                 |
| `dist/svg/<name>.svg`                           | One SVG file per icon, with `fill="currentColor"`.                                                           |
| `dist/icons.svg`                                | An SVG sprite with one `<symbol id="icon-<name>">` per icon.                                                 |

### With Fuselage

Load the font once, then use Fuselage's `Icon` component. Its `name` prop is typed with this package's `Keys`.

```tsx
import '@rocket.chat/icons/dist/rocketchat.css';
import { Icon } from '@rocket.chat/fuselage';

const Bell = () => <Icon name='bell' size='x20' />;
```

### As an icon font

Load `rocketchat.css`, set `font-family: 'RocketChat'` on an element, and put the icon's character inside it. The default export gives you the character for each name.

```ts
import '@rocket.chat/icons/dist/rocketchat.css';
import icons from '@rocket.chat/icons';

const element = document.createElement('i');
element.style.fontFamily = 'RocketChat';
element.setAttribute('aria-hidden', 'true');
element.textContent = icons.bell;
document.body.append(element);
```

The characters live in the Unicode Private Use Area, so the font must be loaded for anything meaningful to show.

### As SVG files

Each icon is also available as a standalone SVG in `dist/svg/`, drawn with `fill="currentColor"`. Inline its markup in the page so the icon takes the current text color. We don't recommend loading these files through `<img>`: the icon then renders black and cannot follow the surrounding color.

### As an SVG sprite

Inline `dist/icons.svg` once in your page, then reference symbols by id:

```html
<svg width="20" height="20" aria-hidden="true">
	<use href="#icon-bell" />
</svg>
```

### Typing icon names

```ts
import type { Keys as IconName } from '@rocket.chat/icons';

const toolbarIcons: IconName[] = ['bell', 'cog', 'magnifier'];
```

### Finding icon names

- List the keys of the default export: `Object.keys(require('@rocket.chat/icons'))`.
- Look at the file names in `dist/svg/` of the installed package.
- Browse the [source SVGs](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/icons/src) in the repository. The file name is the icon name, without the `.svg` extension and without a `.dir` or `.other` suffix. Icons with the `.other` suffix are left out of the font and the character map, and ship only as SVG.

### Right-to-left layouts

Icons whose source file ends in `.dir.svg` are directional (arrows, chevrons and the like). In the font, each of them is mapped to a pair of bidi-mirrored punctuation characters, with the mirrored drawing on the closing character, so the browser picks the flipped glyph in right-to-left text. In `dist/svg/` and `dist/icons.svg`, directional icons carry the class `rcx-svg--directional`, so you can flip them with your own CSS.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/icons). From the repository root:

```sh
yarn workspace @rocket.chat/icons build
yarn workspace @rocket.chat/icons lint
```

To add an icon, put its SVG in `src/` and run `build`. Use the `.dir.svg` suffix for icons that should mirror in right-to-left layouts. The build assigns a font character to every new icon and records it in `glyphsMapping.json`; commit that file too, so existing icons keep their characters. The full guide, including the design and naming conventions, is in [docs/frontend/adding-icons.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/frontend/adding-icons.md).

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
