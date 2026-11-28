# Fuselage tokens

`@rocket.chat/fuselage-tokens` (`packages/fuselage-tokens`) is where the design values of Fuselage and the Rocket.Chat
clients are decided: the colors, the type scale, the lengths, the stacking layers and the breakpoints. Its sources are
[Style Dictionary](https://styledictionary.com/) JSON under `src/`, and the build writes them to `dist/` as JSON and as
SCSS, for any reader. This page explains how the sources are layered, how a token's path relates to what a reader gets,
and who reads each output. The package README describes the `dist` files for npm users.

## Layers

A token belongs to one category, the first segment of its path.

- **Base colors** (`colors`): white and the graded scales of neutral (`n100` to `n900`), red, orange, purple, yellow,
  green and blue, as hex. They are weakly specialized colors that serve the specialized categories, and have no theme.
- **Specialized colors** (`surface`, `font`, `stroke`, `status`, `statusBullet`, `badge`, `button`, `shadow`): one
  color per role, with one object per theme: `light`, `high-contrast` and `dark`. In `light` and `high-contrast` a
  value is a reference to a base color, such as `{colors.b200}`, unless it is translucent and written as `rgba()`; in
  `dark` most values are hex of their own, and some refer to another dark color. A key is named within its category
  and may leave the role implied: in `status`, `info` is the background of an info status and `font-on-info` the text
  on it.
- **Scales** (`spacing`, `size`, `border`, `zIndex`, `breakpoints`, `typography`): the lengths in pixels, the stacking
  layers, the breakpoints with their columns and gutters, the font families and the type scale. They have no theme.

## Paths

A token's path is its category, then its theme when the category has themes, then its key: `status.light.info`. A
reference in a source file names the full path, `{status.light.info}`. There is no `status.info`. A reference may name
any token, not only a base color: `{button.dark.backgroundSecondaryDefault}` says that a color follows another, and
changes with it.

The built files drop the category, and resolve every reference to its value:

- `dist/status.json` holds the themes at its top level, `{ "light": { "info": "#d1ebfe", … }, … }`. A reader picks
  the theme, then the key: `status.light.info`. Keys keep their source spelling, camel case included:
  `button.light.backgroundPrimaryDefault`.
- `dist/status.scss` is one flat map, `$status`, keyed `<theme>-<key>` in kebab case: `'light-info'`, and
  `'light-background-primary-default'` in `$button`.

In the JSON files a color is a hex string, of eight digits when it is translucent, and a length is a number of pixels.
In the SCSS maps, `size` and the border radii are in `rem`, and `spacing` and the border widths are in `px`.

An eight-digit hex rounds the alpha to a step of 1/255, so a translucent color differs slightly between the two
formats: `rgba(47, 52, 61, 0.5)` in a source stays as written in the SCSS maps, and is `#2f343d80` in the JSON, an
alpha of about 0.502. A reader of the JSON, Fuselage's palette included, gets the rounded color.

## Outputs and their readers

| Output                 | Readers                                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/<category>.json` | Fuselage's palette, color props and Tamagui config; the Storybook themes; packages that need a raw value, such as charts, the PDF transcript, the logo and the layout breakpoints |
| `dist/<category>.scss` | Fuselage's stylesheets: the lengths, the type scale and the breakpoint mixins                                                                                                     |

## The names Fuselage writes

The names a Fuselage color goes by, such as `status-background-info` or `button-font-on-secondary-danger-disabled`,
are Fuselage's and are not tokens. Fuselage writes a color as `var(--rcx-color-<name>, <light value>)`, in its
stylesheets and in the color props of `Box` alike. Its own palette, which `PaletteStyleTag` writes, maps each name to a
specialized color of the selected theme and declares those custom properties, together with the theme keys Tamagui
frames read (`--rcx-<name>`). Without it, the page shows the light fallbacks.

The stylesheets' light fallbacks are made from that same palette, inside Fuselage: `yarn workspace @rocket.chat/fuselage
generate:palette` writes its light theme to `src/styles/palette.scss`, so no stylesheet reads a color of
`fuselage-tokens` directly. The other themes reach a stylesheet only through the custom properties `PaletteStyleTag`
declares.

## Fuselage's Tamagui config

`fuselage-tokens` does not know Tamagui. Fuselage's `scripts/generate-tamagui-tokens.mts` reads the JSON files and
writes what the config takes from them to `src/tamagui.tokens.ts` and `src/styles/tamagui-tokens.css`: the `space`,
`size`, `radius` and `zIndex` tokens, a media query per breakpoint, the type scale, and the themes made from Fuselage's
palette. The rules for that mapping, and for the components built on the config, are in
[fuselage-tamagui-components.md](../frontend/fuselage-tamagui-components.md).

## Adding a token

- A color for a new role goes into its specialized category, in the three themes, as a reference to a base color
  where one fits. For Fuselage to write it, its name is added to Fuselage's palette, and `generate:palette` and
  `generate:tamagui-tokens` are run again.
- A length or a layer goes into its scale, in pixels. The SCSS build writes `rem` where a stylesheet reads `rem`, and
  Fuselage's generator does the same for its Tamagui config.
- Adding a token is a `minor` change of `@rocket.chat/fuselage-tokens`. Renaming or removing one breaks whoever reads
  that key from `dist`, inside the monorepo and out, so it is a `major` one.

### The dark and high-contrast values of a new color

Design decides them. Until it does, a new color follows the colors of the same role that already have a value in
every theme, by reference where it can:

- A `secondary-*` button kind takes the backgrounds of `secondary` in dark, `{button.dark.backgroundSecondaryDefault}`
  and the like, as `secondary-danger` does.
- Its text mirrors that of `secondary-danger`: a darker step in high contrast (`r700` to `r900`), a light step in dark
  (`r200`), and the darkest step when disabled in dark (`r1000`).
- A filled kind keeps its light background in dark when its text stays legible on it. Disabled in dark, it takes a
  dark tinted background and the gray text of a disabled `danger`.
- A shadow follows the stroke of the same role: `shadow.dark.extra-light-error` is `{stroke.dark.extraLightError}`.
- A translucent color follows what it does. A veil that has to stand out from the surface under it, such as the
  scrollbar thumb, contrasts with the theme: `n800` in light and high contrast, `n100` in dark. One that darkens what
  lies under it, such as `surface.overlay` and the elevation shadows, stays dark in every theme, and darker in dark.
