1. Settings should be the same as in OAuth section
1. Should be extendable (rocketchat:grant, rocketchat:grant-github etc)
1. Each package with provider should transform it's scope to user data so we can register a new user
1. rocketchat:grant-sub - to define sub configurations to allow for using external apps
1. rocketchat:grant should contain a middleware and startup fn with setup, that is already in rocketchat:oauth-external
1. in callback it would create and / or log in a user
1. without any specified sub configuration, it would redirect to localhost:3000 by default
1. with a specified sub configuration it would redirect to a path and add access_token to the URL


