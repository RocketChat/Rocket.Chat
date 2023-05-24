# Updating JoyPixels

## Generate new category map variable for emojipicker
Run
```
node --experimental-modules generateEmojiIndex.mjs
```

## Generate new percentage sprite
Clone the repository https://github.com/Ranks/JoyPixels/ and replace the file `assets/sprites/JoyPixels.sprites.mustache` with the content 
of [JoyPixels.sprites.mustache](JoyPixels.sprites.mustache), then run at `JoyPixels` folder:

```
grunt sprite
sass --sourcemap=none assets/sprites/JoyPixels.sprites.scss sprites.css
```

And replace the file `sprites.css` at Rocket.Chat's `/packages/rocketchat-emoji-JoyPixels/sprites.css`.
