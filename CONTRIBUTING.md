# Contributing to Rocket.Chat

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to Rocket.Chat and its packages, which are hosted in the [Rocket.Chat Organization](https://github.com/RocketChat) on GitHub.

__Note:__ If there's a feature you'd like, there's a bug you'd like to fix, or you'd just like to get involved please raise an issue and start a conversation. We'll help as much as we can so you can get contributing - although we may not always get back right away :)

## Coding standards

Most of the coding standards are covered by `.editorconfig`.

Things not covered by jshint:

* Unless required __no semicolons__ they are not required
* Short one-line `if` statements do not require nipple brackets (provided functionality is clear)
* Multiple conditionals within an `if` statement should be surrounded by brackets
* `exports`/`module.exports` should be at the end of the file
* Longer, descriptive variable names are preferred, e.g. `error` vs `err`

We acknowledge all the code does not meet these standards but we are working to change this over time.
