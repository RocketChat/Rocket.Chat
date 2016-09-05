# Updating emojione

## Generate new category map variable for emojipicker
Update the variable `emojiList` in the file `generateEmojiIndex.js` with the content of the file https://github.com/Ranks/emojione/blob/master/emoji.json

After that, run:
```
node generateEmojiIndex.js
```

Grab the result and update the file `emojiPicker.js`.

## Generate new percentage sprite
Clone the repository https://github.com/Ranks/emojione/ and replace the file `assets/sprites/emojione.sprites.mustache` with the content 
of [emojione.sprites.mustache](emojione.sprites.mustache), then run at `emojione` folder:

```
grunt sprite
sass --sourcemap=none assets/sprites/emojione.sprites.scss sprites.css
```

And replace the file `sprites.css` at Rocket.Chat's `/packages/rocketchat-emojione/sprites.css`.
