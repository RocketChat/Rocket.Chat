# Contributing to Rocket.Chat

We appreciate you taking interest in Rocket.Chat. Before opening a pull request, please share your interest about the issue or feature implementation on our open community server's dev channel (https://open.rocket.chat/channel/dev). Someone from our community team will respond in due time.

Every bit of contribution is appreciated 🙂 thank you!

## Development Guidelines

The following is a set of guidelines for contributing to Rocket.Chat

## Coding Style

We provide a [.editorconfig](https://github.com/RocketChat/handbook/tree/d83129860783e026ac41ca3c8cf8cf0f4b3dd1f2/product/.editorconfig/README.md) file that will help you to keep some standards in place.

### ECMAScript vs TypeScript

We are currently adopting TypeScript as the default language on our projects, the current codebase will be migrated incrementally from JavaScript to TypeScript.

While we still have a lot of JavaScript files you should not create new ones. As much as possible new code contributions should be in **TypeScript**.

### Blaze vs React

We are currently adopting React over Blaze as our UI engine, the current codebase is under migration and will continue. You will still find Blaze templates in our code. Code changes or contributions may need to be made in Blaze while we continue to evolve our components library.

The [Fuselage](https://github.com/RocketChat/Rocket.Chat.Fuselage) is our component library based on React, check it out when contributing to the Rocket.Chat UI and feel free to contribute new components or fixes.

### Standards

Most of the coding standards are covered by ESLint configured at [.eslintrc](https://github.com/RocketChat/handbook/tree/d83129860783e026ac41ca3c8cf8cf0f4b3dd1f2/product/.eslintrc/README.md), and most of them came from our own [ESLint Config Package](https://github.com/RocketChat/eslint-config-rocketchat).

Things not covered by `eslint`:

- Prefer longer/descriptive variable names, e.g. `error` vs `err`, unless dealing with common record properties already shortened, e.g. `rid` and `uid`
- Use return early pattern. [See more](https://blog.timoxley.com/post/47041269194/avoid-else-return-early)
- Prefer `Promise` over `callbacks`
- Prefer `await` over `then/catch` \(also valid for unit/e2e test callbacks\)
- Don't create queries outside models, the query description should be inside the model class.
- Don't hardcode fields inside models. the same method can be used for different purposes, using different fields.
- Prefer to create REST endpoints over Meteor methods
- Prefer call REST endpoints over Meteor methods when both are available
- v1 REST endpoints should follow the following pattern: `/api/v1/dashed-namespace.camelCaseAction`
- Prefer TypeScript over JavaScript. Check ECMAScript vs TypeScript

**Blaze**

- Import the HTML file from it's sibling JS/TS file

### Best practices

- Avoid "internal" `Meteor.call` - server code should not use `Meteor.call`

### Syntax check

Before submitting a PR you should get no errors on `eslint`.

To check your files run:

```shell
meteor npm run lint
```

## Tests

There are 2 types of tests we run on Rocket.Chat, **Unit** tests and **End to End** tests. The major difference is that End to End tests require a Rocket.Chat instance running to execute the API and UI checks.

### End to End Tests

First, you need to run a Rocket.Chat server on **Test Mode** and on an **Empty Database**:

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

### Unit Tests

Unit tests are simpler to set up and run. They do not require a working Rocket.Chat instance.

```shell
meteor npm run testunit
```

It's possible to run on watch mode as well:

```shell
meteor npm run testunit-watch
```

## Before Push your code

It's important to run the lint and tests before push your code or submit a Pull Request, otherwise, your contribution may fail quickly on the CI. Reviewers are forced to demand fixes and the review of your contribution will be further delayed.

Rocket.Chat uses [husky](https://www.npmjs.com/package/husky) to run the **lint** and **unit tests** before proceeding to the code push process, so you may notice a delay when pushing your code to your repository.

## Choosing a good PR title

It is very important to note that we use PR titles when creating our changelog. Keep this in mind when you title your PR. Make sure the title makes sense to a person reading a releases' changelog!

Keep your PR's title as short and concise as possible, use PR's description section, which you can find in the PR's template, to provide more details into the changelog.

Good titles require thinking from a user's point of view. Don't get technical and talk code or architecture. What is the actual user-facing feature or the bug fixed? For example:

```text
[NEW] Allow search permissions and settings by name instead of only ID
```

Even it's being something new in the code the users already expect the filter to filter by what they see \(translations\), a better one would be:

```text
[FIX] Permissions' search doesn't filter base on presented translation, only on internal ids
```

## Choosing the right PR tag

You can use several tags do describe your PR, i.e.: `[FIX]`, `[NEW]`, etc. You can use the descriptions below to better understand the meaning of each one, and decide which one you should use:

### `[NEW]`

**When**

- When adding a new feature that is important to the end-user

**How**

Do not start repeating the section \(`Add ...` or `New ...`\) Always describe what's being fixed, improved or added and not _how_ it was fixed, improved or added.

Example of **bad** PR titles:

```text
[NEW] Add ability to set tags in the Omnichannel room closing dialog
[NEW] Adds ability for Rocket.Chat Apps to create discussions
[NEW] Add MMS support to Voxtelesys
[NEW] Add Color variable to left sidebar
```

Example of **good** PR titles:

```text
[NEW] Ability to set tags in the Omnichannel room closing dialog
[NEW] Ability for Rocket.Chat Apps to create discussions
[NEW] MMS support to Voxtelesys
[NEW] Color variable to left sidebar
```

### `[FIX]`

**When**

- When fixing something not working or behaving wrong from the end-user perspective

**How**

Always describe what's being fixed and not _how_ it was fixed.

Example of a **bad** PR title:

```text
[FIX] Add Content-Type for public files with JWT
```

Example of a **good** PR title:

```text
[FIX] Missing Content-Type header for public files with JWT
```

### `[IMPROVE]`

**When**

- When a change enhances a not buggy behavior. When in doubt if it's an **Improve** or **Fix** prefer to use **Fix**.

**How**

Always describe what's being improved and not _how_ it was improved.

Example of **good** PR title:

```text
[IMPROVE] Displays Nothing found on admin sidebar when search returns nothing
```

### `[BREAK]`

**When**

- When the changes affect a working feature

**Back-End**

- When the API contract \(data structure and endpoints\) are limited, expanded as required or removed
- When the business logic \(permissions and roles\) are limited, expanded \(without migration\) or removed

**Front-End**

- When the change limits \(format, size, etc\) or removes the ability to read or change the data \(when the limitation was not caused by the back-end\)

### `Regression`

**When**

- When changes are made during release candidate cycle to in order to add something missing or fix something broken during the last development cycle and _not published to a final release yet_.

Example of **good** PR titles:

```text
Regression: Fix not being able to mark room as read
Regression: Add missing field to `users` endpoint
```

### Second tag e.g. `[NEW][ENTERPRISE]`

Use a second tag to group entries on the changelog. We currently use it only for Enterprise and Apps items, but we are going to expand its usage soon. If you're not sure about which one to use, you most likely _do not need to use a second tag._ We're still coming up with a pattern for it.

### Minor Changes

For those PRs that aren't important for the end-user, we are working on a better pattern, but for now please use the same tags, use them without the brackets and in camel case:

```text
Fix: Missing Content-Type header for public files with JWT
```

All those PRs will be grouped under the `Minor changes` section which is collapsed, so users can expand it to check for those minor things but they are not visible directly on the changelog.

## Security Best Practices

- Never expose unnecessary data to the APIs' responses
- Always check for permissions or create new ones when you must expose sensitive data
- Never provide new APIs without rate limiters
- Always escape the user's input when rendering data
- Always limit the user's input size on the server-side
- Always execute the validations on the server-side even when executing on the client-side as well

## Performance Best Practices

- Prefer to inform the fields you want, and only the necessary ones, when querying data from the database over query the full documents
- Limit the number of returned records to a reasonable value
- Check if the query is using indexes, if it's not, create new indexes
- Prefer queues over long executions
- Create new metrics to measure things whenever possible
- Cache data and returns whenever possible

## Contributor License Agreement

To have your contribution accepted you must sign our [Contributor License Agreement](https://cla-assistant.io/RocketChat/Rocket.Chat). In case you submit a Pull Request before sign the CLA GitHub will alert you with a new comment asking you to sign and will block the Pull Request from be merged by us.

Please review and sign our CLA at [https://cla-assistant.io/RocketChat/Rocket.Chat](https://cla-assistant.io/RocketChat/Rocket.Chat)
