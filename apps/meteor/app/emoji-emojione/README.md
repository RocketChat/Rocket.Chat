# Updating emojione

## Generate new category map variable for emojipicker
Run
```
node --experimental-modules generateEmojiIndex.mjs
```

## Generate new percentage sprite
Clone the repository https://github.com/Ranks/emojione/ and replace the file `assets/sprites/emojione.sprites.mustache` with the content 
of [emojione.sprites.mustache](emojione.sprites.mustache), then run at `emojione` folder:

```
grunt sprite
sass --sourcemap=none assets/sprites/emojione.sprites.scss sprites.css
```

And replace the file `sprites.css` at Rocket.Chat's `/packages/rocketchat-emoji-emojione/sprites.css`.
