<!--header-->

<p align="center">
  <a href="https://rocket.chat" title="Rocket.Chat">
    <img src="https://github.com/RocketChat/Rocket.Chat.Artwork/raw/master/Logos/2020/png/logo-horizontal-red.png" alt="Rocket.Chat" />
  </a>
</p>

# `@rocket.chat/fuselage-ui-kit`

> UiKit elements for Rocket.Chat Apps built under Fuselage design system

---

[![npm@latest](https://img.shields.io/npm/v/@rocket.chat/fuselage-ui-kit/latest?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons/v/latest) [![npm@next](https://img.shields.io/npm/v/@rocket.chat/fuselage-ui-kit/next?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/icons/v/next) ![react version](https://img.shields.io/npm/dependency-version/@rocket.chat/fuselage-ui-kit/peer/react?style=flat-square) [![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://rocketchat.github.io/Rocket.Chat.Fuselage/fuselage-ui-kit) ![npm downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage-ui-kit?style=flat-square) ![License: MIT](https://img.shields.io/npm/l/@rocket.chat/fuselage-ui-kit?style=flat-square)

![deps](https://img.shields.io/david/RocketChat/fuselage?path=packages%2Ffuselage-ui-kit&style=flat-square) ![peer deps](https://img.shields.io/david/peer/RocketChat/fuselage?path=packages%2Ffuselage-ui-kit&style=flat-square) ![dev deps](https://img.shields.io/david/dev/RocketChat/fuselage?path=packages%2Ffuselage-ui-kit&style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/min/@rocket.chat/fuselage-ui-kit?style=flat-square)

<!--/header-->

## Install

<!--install-->

Firstly, install the peer dependencies (prerequisites):

```sh
npm i @rocket.chat/fuselage @rocket.chat/fuselage-hooks @rocket.chat/fuselage-polyfills @rocket.chat/icons @rocket.chat/styled react react-dom

# or, if you are using yarn:

yarn add @rocket.chat/fuselage @rocket.chat/fuselage-hooks @rocket.chat/fuselage-polyfills @rocket.chat/icons @rocket.chat/styled react react-dom
```

Add `@rocket.chat/fuselage-ui-kit` as a dependency:

```sh
npm i @rocket.chat/fuselage-ui-kit

# or, if you are using yarn:

yarn add @rocket.chat/fuselage-ui-kit
```

<!--/install-->

## Contributing

<!--contributing(msg)-->

Contributions, issues, and feature requests are welcome!<br />
Feel free to check the [issues](https://github.com/RocketChat/fuselage/issues).

<!--/contributing(msg)-->

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

### Component stories

We develop and describe our visual components in the form of stories, manage by a tool called [Storybook](https://storybook.js.org/).
To start developing with Storybook, run:

<!--yarn(storybook)-->

```sh
yarn storybook
```

<!--/yarn(storybook)-->
