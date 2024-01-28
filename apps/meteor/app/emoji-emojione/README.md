# Updating joypixels

## Generate new category map variable for emojipicker
Run
```
node --experimental-modules generateEmojiIndex.mjs
```

## Generate new percentage sprite
Clone the repository https://github.com/Ranks/joypixels/ and replace the file `assets/sprites/joypixels.sprites.mustache` with the content 
of [joypixels.sprites.mustache](joypixels.sprites.mustache), then run at `joypixels` folder:

```
grunt sprite
sass --sourcemap=none assets/sprites/joypixels.sprites.scss sprites.css
```

And replace the file `sprites.css` at Rocket.Chat's `/packages/rocketchat-emoji-joypixels/sprites.css`.
