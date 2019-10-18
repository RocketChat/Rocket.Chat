This package contains internationalization for Rocket.Chat.

Due to limitations of the i18n-library used, _only_ translations from this very folder will be respected.
Thus, if you extend Rocket.Chat with custom packages which have got own translation files, you'll have to put them into this package. They should be named `<package>.<language>.i18n.(json|yaml)`.

Alternatively, you can add the i18n-files in your package and then copy it to this folder during build time. In this case, you should add the copied files to the `.gitignore`. See [how livechat did](../package.js) as an example.
