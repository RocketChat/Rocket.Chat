# Updating emojis (now using emoji-toolkit)

## Generate new category map variable for emojipicker
Run the generator script which now pulls metadata from `emoji-toolkit`

```
node --experimental-modules generateEmojiIndex.mjs
```

The script will download 64px PNGs from the JoyPixels CDN into `.emoji-cache`
and build updated sprite sheets under `public/packages/emojione/`.

## Sprite generation notes
The old manual `grunt`/`sass` workflow is no longer required.  If you need to
rebuild sprites offline you can cache the PNG files yourself by running the
script once with internet access; subsequent runs will reuse the cached images.

The generated CSS is written to `apps/meteor/app/emoji-emojione/client/emojione-sprites.css`.
