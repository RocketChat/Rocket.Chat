# Updating emoji-toolkit

## Generate new category map variable for emojipicker
Run
```
node --experimental-modules generateEmojiIndex.mjs
```

## Generate new percentage sprite
Clone the repository https://github.com/Ranks/emoji-toolkit/ and replace the file `assets/sprites/emoji-toolkit.sprites.mustache` with the content 
of [emoji-toolkit.sprites.mustache](emoji-toolkit.sprites.mustache), then run at `emoji-toolkit` folder:

```
grunt sprite
sass --sourcemap=none assets/sprites/emoji-toolkit.sprites.scss sprites.css
```

And replace the file `sprites.css` at Rocket.Chat's `/packages/rocketchat-emoji-emoji-toolkit/sprites.css`.
