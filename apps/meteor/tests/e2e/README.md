# E2E Testing with playwright

## Running tests
The application must be started with `TEST_MODE=true`

```sh
$ TEST_MODE=true yarn dev
```

Then we can run a single suite with

```sh
$ yarn test:playwright ./tests/e2e/01-forgot-password.spec.ts
```

Or all the tests with

```sh
$ yarn test:playwright
```

We also can pass `PWDEBUG=1` to controll the test execution

## Current limitations
- 00-wizard.spec.ts will only pass if the database is empty
- There are some dependencies between tests, so we can't run the suites in parallel

## Page Objects
- Any locator name must start with of one the following prefixes: `btn`, `link`, `input`, `select`, `checkbox`, `text`
- Any action name should starts with the prefix `do`

## Important links
- [playwright docs](https://playwright.dev/docs/intro)
