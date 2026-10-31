# Adding icons

Icons live in `packages/icons` and are published as `@rocket.chat/icons`. Every SVG file in `packages/icons/src/` becomes one icon, shipped as a font glyph, a standalone SVG, a symbol in the SVG sprite, and a key of the `Keys` type that Fuselage's `Icon` component accepts as `name`.

## Design

Rocket.Chat's design team draws every icon, and every icon must be published on Figma before it lands here. The drawing follows these conventions:

- The view box is 32×32 units.
- Any horizontal asymmetry points left-to-right. The right-to-left variant is generated, never drawn (see [Directional icons](#directional-icons)).

## Cleaning the SVG

Icons are scaled arbitrarily and recolored with `currentColor`, so the source file must carry only the shape. Figma exports extra attributes and elements; strip them:

- The `<svg>` element keeps only `viewBox` (normally `"0 0 32 32"`) and `xmlns`.
- XLink references, such as masks and clip paths, are discarded.
- `<path>` elements keep only the `d` attribute, with no styling attributes such as `fill` or `stroke`.
- `<g>` and any other element are removed by optimization tooling, leaving only `<path>` elements.

A clean source file looks like this:

```xml
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6H7V11H8C8.55228 11 …" />
</svg>
```

## Naming

The file name, without its extension, is the icon name. **An icon name describes the icon's shape, not its purpose**, because the same shape ends up used for different things:

- `message.svg` — wrong
- `balloon.svg` — right

New icons go directly in `src/`. Two subdirectories hold icons kept for compatibility, and new icons do not go there:

- `src/aliases/` keeps old names working after an icon was renamed. Each file is a copy of the renamed icon (for example, `aliases/add-user.svg` is the same drawing as `user-plus.svg`). When you rename an icon, move the old file here so consumers using the old name don't break.
- `src/legacy/` holds older icons that don't follow the current conventions.

## Directional icons

If an icon must be mirrored in right-to-left layouts (arrows, chevrons, anything that points), add `.dir` before the extension: `backspace.dir.svg`. The icon name is still `backspace`.

The build draws the mirrored version itself. In the font, a directional icon takes a pair of bidi-mirrored punctuation characters, with the mirrored drawing on the closing one, so browsers flip it in right-to-left text. In the SVG outputs, it gets the `rcx-svg--directional` class.

## Building

From the repository root:

```sh
yarn workspace @rocket.chat/icons build
```

The build assigns a font character to every icon that does not have one yet and records it in `packages/icons/glyphsMapping.json`. **Commit that file with the new icon.** Existing entries must never change: consumers using the icon font address icons by character, and a reassigned character shows a different icon.

Check the source style before committing:

```sh
yarn workspace @rocket.chat/icons lint
```

### Holes in the font glyph

A path with `fill-rule="evenodd"` can cut a hole whose subpath runs in the same direction as the shape around it. The SVG shows the hole, but a font glyph keeps no fill rule: it fills every subpath of every path with the nonzero rule, so the font fills the hole in. The fix is to reverse the direction of the hole's subpath, which keeps the hole under either rule and leaves the SVG unchanged.

Check every `evenodd` icon before committing:

```sh
yarn workspace @rocket.chat/icons check:fill
```

It rasterizes each icon as the SVG fills it and as the font glyph does, and flags as `BROKEN` any icon where the two differ by more than 0.1% of the view box. It reads only `<path>` elements with absolute `M`, `L`, `H`, `V`, `C` and `Z` commands, and stops on anything else.

## Releasing

`@rocket.chat/icons` is published to npm, so a new icon needs a changeset with a minor bump:

```md
---
'@rocket.chat/icons': minor
---

Adds the `balloon` icon
```

Within the monorepo, Fuselage and the Meteor app use the workspace copy, so the icon is available to them as soon as the package is built.
