## HOW INSERT A NEW ICON

paste your icon on `./icons` folder

run below commands inside `app/ui-master/public` directory

```js
node generateSprite.js
node generateHTML.js
```


After that 2 new files named `icons.html` and `icons.svg` will be generated. You need to cut and replace these two files to following locations.

- icons.html to `public/public/icons.html`

- icons.svg to `private/public/icons.svg`
