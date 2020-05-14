# Contributing to Rocket.Chat

**First off, thanks for taking the time to contribute! :tada::+1:**

The following is a set of guidelines for contributing to Rocket.Chat, which are hosted in the [Rocket.Chat Organization](https://github.com/RocketChat) on GitHub.

__Note:__ If there's a feature you'd like, there's a bug you'd like to fix, or you'd just like to get involved please raise an issue and start a conversation. We'll help as much as we can so you can get contributing - although we may not always be able to respond right away :)

## ECMAScript vs TypeScript

We are currectly adopting TypeScript as the default language on our projects, the current codebase will be migrated, along the time, from JavaScript to TypeScript.

While we still have a lot of JavaScript files you should not create new ones. As much as possible new code contributions should be in **TypeScript**.

## Coding standards

Most of the coding standards are covered by ESLint configured at [.eslintrc](../.eslintrc), and most os them cames from our own [ESLint Config Package](https://github.com/RocketChat/eslint-config-rocketchat).

Things not covered by `eslint`:

* `exports` should be at the end of the file
* Longer, descriptive variable names are preferred, e.g. `error` vs `err`

We provide a [.editorconfig](../.editorconfig) file that will help you to keep some standards in place.

### Syntax check

Before submitting a PR you should get no errors on `eslint`.

To check your files run:

```
npm run lint
```

# Contributor License Agreement

Please review and sign our CLA at https://cla-assistant.io/RocketChat/Rocket.Chat
