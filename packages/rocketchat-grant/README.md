# rocketchat:grant

The main idea behind creating this package was to allow external apps (i.e. PWA) to use OAuth smoothely with currently available accounts system.

## Usage

1. Define providers using `Settings.add()`
1. Add apps with `Settings.apps.add()`
1. Put the path that stars OAuth flow in your app
1. You app should be able to authenticate user with received tokens

## Paths

There are few paths you need to be familiar with.

### Start OAuth flow

> \<ROOT_PATH>/_oauth_apps/connect/\<PROVIDER>/\<APP>

### Authorization callback URL

> \<ROOT_PATH>/_oauth_apps/connect/\<PROVIDER>/callback

### List of available providers

> \<ROOT_PATH>/_oauth_apps/providers

## API

### Providers

#### Providers.register(name, options, getUser)

Allows to register an OAuth Provider.

- name - string that represents the name of an OAuth provider
- options - contains fields like _scope_
- getUser - a function that returns fields: _id, email, username, name and avatar_

### Settings

#### Settings.add(options)

Defines a provider that is able for being used in OAuth.

**options**:

- enabled - __boolean__ - tells to `rocketchat:grant` if provider could be used
- provider - __string__ - id of a provider
- key - __string__ - client ID provided for your OAuth access
- secret - __string__ - secret key

Example:

```js
  Settings.add({
    enabled: true,
    provider: 'google',
    key: 'CLIENT_ID',
    secret: 'SECRET'
  });
```

#### Settings.apps.add(name, options)

Defines an app that is able for using OAuth.

**options**:

- redirectUrl - __string__ - where to redirect if auth was succesful
- errorUrl - __string__ - place to redirect on failure

Example:

```js

  const redirectUrl = 'http://localhost:4200/login?service={provider}&access_token={accessToken}&refresh_token={refreshToken}';

  const errorUrl = 'http://localhost:4200/login?service={provider}&error={error}'


  Settings.apps.add('PWA', {
    redirectUrl,
    errorUrl
  });
```

About URLs:

We use a parser to produce a URL.
There are few available variables for each type of redirect.

- redirectUrl - provider, accessToken, refreshToken
- errorUrl - provider, error

Example:

```
http://localhost:4200/login?provider={provider}
// outputs: http://localhost:4200/login?provider=google
```
