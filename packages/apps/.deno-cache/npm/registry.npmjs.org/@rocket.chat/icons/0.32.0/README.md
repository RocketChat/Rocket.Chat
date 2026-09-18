<!--header-->

<p align="center">
  <a href="https://rocket.chat" title="Rocket.Chat">
    <img src="https://github.com/RocketChat/Rocket.Chat.Artwork/raw/master/Logos/2020/png/logo-horizontal-red.png" alt="Rocket.Chat" />
  </a>
</p>

# `@rocket.chat/icons`

> Rocket.Chat's Icons

---

[![npm@latest](https://img.shields.io/npm/v/@rocket.chat/icons/latest?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons/v/latest) [![npm@next](https://img.shields.io/npm/v/@rocket.chat/icons/next?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons/v/next) ![npm downloads](https://img.shields.io/npm/dw/@rocket.chat/icons?style=flat-square) ![License: MIT](https://img.shields.io/npm/l/@rocket.chat/icons?style=flat-square)

![deps](https://img.shields.io/librariesio/release/npm/@rocket.chat/icons?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/min/@rocket.chat/icons?style=flat-square)

<!--/header-->

## Install

<!--install-->

Add `@rocket.chat/icons` as a dependency:

```sh
npm i @rocket.chat/icons

# or, if you are using yarn:

yarn add @rocket.chat/icons
```

<!--/install-->

## Contributing

<!--contributing(msg)-->

Contributions, issues, and feature requests are welcome!<br />
Feel free to check the [issues](https://github.com/RocketChat/fuselage/issues).

<!--/contributing(msg)-->

### Adding new icons

All the icons should be designed by Rocket.Chat's design crew, following some conventions:

- The view box must have the dimensions of 32x32 units;
- Any horizontal assimetry must follow the left-to-right direction.
- The icon must be published on Figma.

As the icons might be arbitrarily scaled, the chosen source format for individual icon graphics is
SVG. As Figma can export graphics with some additional SVG attributes and elements, they must be
removed:

- The `<svg>` element must contain only two attributes: `viewBox` (probably with the value of`"0 0 32 32"`) and
  `xmlns`;
- XLink references (e.g. masks and clip paths) must be discarded;
- The `<path>` elements must keep only the `d` attribute, with no additional styling attribute;
- `<g>` and other elements must be stripped by some optimization tooling, keeping only `<path>` elements.

The `src/` directory holds all the SVG icons that would be processed. The filenames define the icon names, so they
should stick with a basic rule: **an icon name must describe the icon shape, not its utility**. For instance:

- [ ] `message.svg` (wrong)
- [x] `balloon.svg` (right)

If the icon must be mirrored for right-to-left read direction, it required to add a trailing `.dir` before the file
extension (e.g. `backspace.dir.svg`).

### Building

As this package dependends on others in this monorepo, before anything run the following at the root directory:

<!--yarn(build)-->

```sh
yarn build
```

<!--/yarn(build)-->

### Linting

To ensure the source is matching our coding style, we perform [linting](<https://en.wikipedia.org/wiki/Lint_(software)>).
Before commiting, check if your code fits our style by running:

<!--yarn(lint)-->

```sh
yarn lint
```

<!--/yarn(lint)-->

Some linter warnings and errors can be automatically fixed:

<!--yarn(lint-and-fix)-->

```sh
yarn lint-and-fix
```

<!--/yarn(lint-and-fix)-->

### Usage

To use the fuselage icons, you need to import the css first:

```css
@import url('@rocket.chat/icons/dist/rocketchat.css');
```

Usage Example:

```html
<!-- Using Fuselage's Icon Component (Recommended) -->
<Icon name="hash" size="x20" />

<!-- HTML markup -->
<i class="rcx-icon">{icon}</i>
```
