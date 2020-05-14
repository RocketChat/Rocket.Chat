# Contributing to Rocket.Chat

**First off, thanks for taking the time to contribute! :tada::+1:**

The following is a set of guidelines for contributing to Rocket.Chat, which are hosted in the [Rocket.Chat Organization](https://github.com/RocketChat) on GitHub.

__Note:__ If there's a feature you'd like, there's a bug you'd like to fix, or you'd just like to get involved please raise an issue and start a conversation. We'll help as much as we can so you can get contributing - although we may not always be able to respond right away :)

## Setup

Rocket.Chat runs on top of [Meteor](https://www.meteor.com/). To run it on development mode you need to [install Meteor](https://www.meteor.com/install) and clone/download the Rocket.Chat's code, then just open the code folder and run:
```shell
meteor npm install && meteor
```
It should build and run the application and database for you, now you can access the UI on (http://localhost:3000)

It's not necessary to install Nodejs or NPM, every time you need to use them you can run `meteor node` or `meteor npm`.

It's important to always run the NPM commands using `meteor npm` to ensure that you are installing the modules using the right Nodejs version.

## Coding

<!--
* Define and describe folder structure
* Define how singletons are declared and exported
* When and how to use documenting comments
* Standardize error codes/messages
 -->

We provide a [.editorconfig](../.editorconfig) file that will help you to keep some standards in place.

### ECMAScript vs TypeScript

We are currently adopting TypeScript as the default language on our projects, the current codebase will be migrated, along the time, from JavaScript to TypeScript.

While we still have a lot of JavaScript files you should not create new ones. As much as possible new code contributions should be in **TypeScript**.

### Blaze vs React

`<!-- TODO -->`

### Standards

Most of the coding standards are covered by ESLint configured at [.eslintrc](../.eslintrc), and most os them came from our own [ESLint Config Package](https://github.com/RocketChat/eslint-config-rocketchat).

Things not covered by `eslint`:

* Prefer longer/descriptive variable names, e.g. `error` vs `err`, unless dealing with common record properties already shortened, e.g. `rid` and `uid`
* Use return early pattern. [See more](https://blog.timoxley.com/post/47041269194/avoid-else-return-early)
* Prefer `Promise` over `callbacks`
* Prefer `await` over `then/catch`
* Don't create queries outside models, the query description should be inside the model class.
* Don't hardcode fields inside models. Same method can be used for different purposes, using different fields.
* Prefer create REST endpoints over Meteor methods
* Prefer call REST endpoints over Meteor methods when both are available
* v1 REST endpoints should follow the following pattern: `/api/v1/dashed-namespace.camelCaseAction`
* Prefer TypeScript over JavaScript. Check [ECMAScript vs TypeScript](#ecmascript-vs-typescript)

#### Blaze
* Import the HTML file from it's sibling JS/TS file

### Syntax check

Before submitting a PR you should get no errors on `eslint`.

To check your files run:

```shell
meteor npm run lint
```

### Tests

There are 2 types of tests we run on Rocket.Chat, **Unit** tests and **End to End** tests. Different from the Unit tests the End to End depends on a Rocket.Chat instance running to execute the API and UI checks.

#### End to End Tests

First you need to run a Rocket.Chat server on **Test Mode** and on a **Empty Database**:
```shell
# Running with a local mongodb database
MONGO_URL=mongodb://localhost/empty MONGO_OPLOG_URL=mongodb://localhost/local TEST_MODE=true meteor
```
```shell
# Running with a local mongodb database but cleaning it before
mongo --eval "db.dropDatabase()" empty && MONGO_URL=mongodb://localhost/empty MONGO_OPLOG_URL=mongodb://localhost/local TEST_MODE=true meteor
```

Now you can run the tests:
```shell
meteor npm test
```

#### Unit Tests

Unit tests are simple to run, the don't depends on a Rocket.Chat instance running, just execute:
```shell
meteor npm run testunit
```

It's possible to run on watch mode as well:
```shell
meteor npm run testunit-watch
```

### Before Push your code

It's important to run the lint and tests before push your code or submit a Pull Request, otherwise your contribution may fail quickly on the CI and the reviewers will need to request you to fix those errors delaying the review of your contribution.

Rocket.Chat uses [husky](https://www.npmjs.com/package/husky) to run the **lint** and **unit tests** before proceed to the code push process, so you may notice a delay when pushing your code to your repository.

## Choosing a good PR title

We use PR titles to on our change log, so when writing the PR title bare in mind it should make sense to a person reading the a release's change log.

Keep your PR's title as short and concise as possible, use PR's description section, which you can find in the PR's template, to provide more details into the changelog.

Good PR's titles should be made thinking from the user's perspective, what is a new thing in the code may be a bug for the end users, example:

```
[NEW] Allow search permissions and settings by name instead of only ID
```

Even it's being something new in the code the users already expect the filter to filter by what they see (translations), a better one would be:

```
[FIX] Permissions' search doesn't filter base on presented translation, only on internal ids
```

## Choosing the right PR tag

You can use several tags do describe your PR, i.e.: `[FIX]`, `[NEW]`, etc. You can use the descriptions below to better understand the meaning of each one, and decide which one you should use:

### `[FIX]`

<!-- #### When -->

#### How

Always describe what's being fixed and not *how* it was fixed.

Exemple of a **bad** PR title:

```
[FIX] Add Content-Type for public files with JWT
```

Exemple of a **good** PR title:

```
[FIX] Missing Content-Type header for public files with JWT
```

### `[NEW]`

#### When
- When adding a new feature that is important to the end user

#### How

Do not start repeating the section (`Add ...` or `New ...`)
Always describe what's being fixed, improved or added and not *how* it was fixed, improved or added.

Exemple of **bad** PR titles:

```
[NEW] Add ability to set tags in the Omnichannel room closing dialog
[NEW] Adds ability for Rocket.Chat Apps to create discussions
[NEW] Add MMS support to Voxtelesys
[NEW] Add Color variable to left sidebar
```

Exemple of **good** PR titles:

```
[NEW] Ability to set tags in the Omnichannel room closing dialog
[NEW] Ability for Rocket.Chat Apps to create discussions
[NEW] MMS support to Voxtelesys
[NEW] Color variable to left sidebar
```

### `[IMPROVE]`

#### When
- When a change enhances a not buggy behavior

#### How
Always describe what's being improved and not *how* it was improved.

Exemple of **good** PR title:

```
[IMPROVE] Displays Nothing found on admin sidebar when search returns nothing
```

### `[BREAK]`

#### When
- When the changes affect a working feature

##### Back-End
- When the API contract (data structure and endpoints) are limited, expanded as required or removed
- When the business logic (permissions and roles) are limited, expanded (without migration) or removed

##### Front-End
- When the change limits (format, size, etc) or removes the ability of read or change the data (when the limitation was not caused by the back-end)


<!-- Use can use a second tag to group entries on the change log. -->

## Storybook

`<!-- TODO -->`

## Contributor License Agreement

To have your contribution accepted you must sign our [Contributor License Agreement](https://cla-assistant.io/RocketChat/Rocket.Chat). In case you submit a Pull Request before sign the CLA GitHub will alert you with a new comment asking you to sign and will block the Pull Request from be merged by us.

Please review and sign our CLA at https://cla-assistant.io/RocketChat/Rocket.Chat
