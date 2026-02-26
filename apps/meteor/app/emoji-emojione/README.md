# Emoji Migration Notes (Emojione -> emoji-toolkit)

This package now uses `emoji-toolkit` + `emoji-assets` as the runtime source.

`emojione` naming is still present in paths and module names for historical compatibility, but rendering is powered by `emoji-toolkit`.

## Why names still say "emojione"

- Backward compatibility with existing package structure and imports.
- Avoiding broad renames across client/server emoji integration.
- Minimizing migration risk in downstream code.

## Important rendering rule

Use one class naming scheme consistently in generated markup and CSS selectors.

- Generated sprite selectors are `joypixels-*`.
- If markup returns `emojione*` classes while CSS expects `joypixels-*`, you can get duplicated/misaligned emoji rendering in the picker.

When changing rendering logic, keep these aligned:

- `lib/getEmojiConfig.ts` (`convertShortName`, `convertUnicode`)
- `lib/emoji-toolkit.tpl` (sprite selector template)
- `client/*-sprites.css` and `client/emojione-sprites.css` base class styles

## Regenerate emoji picker index and sprite CSS

before using below command make sure to run: npm i --no-save node-sprite-generator

From `apps/meteor/app/emoji-emojione/lib` run:

```bash
node --experimental-modules generateEmojiIndex.mjs
```

This regenerates:

- `emojiPicker.js` category/tone maps
- `client/*-sprites.css` selector files
- `client/emojione-sprites.css` imports + base emoji style block
- `../../public/packages/emoji-toolkit` necessary sprite files

## Migration checklist

1. Confirm `emoji-toolkit` + `emoji-assets` versions in `package.json`.
2. Regenerate assets with `generateEmojiIndex.mjs`.
3. Verify generated selectors match rendered class names.
4. Test picker search, recent emojis, skin tones, flags, and ASCII conversion.
5. Validate message rendering and picker rendering both use the expected sprite classes.

## Legacy note

The repository may still reference `emojione` in file names and APIs. Treat this as naming legacy, not provider source. The active provider is `emoji-toolkit`.
