# E2E Testing with playwright

## Running tests
The application must be started with `TEST_MODE=true`

```sh
$ TEST_MODE=true yarn dev
```

Then we can run a single suite with

```sh
$ yarn test:e2e ./tests/e2e/administration.spec.ts
```

Or all the tests with

```sh
$ yarn test:e2e
```

We can also provide some env vars to `test:e2e` script:
- `BASE_URL=<any_url>` Run the tests to the given url
- `PWDEBUG=1` Controll the test execution

## Page Objects
- Any locator name must start with of one the following prefixes: `btn`, `link`, `input`, `select`, `checkbox`, `text`

## Important links
- [playwright docs](https://playwright.dev/docs/intro)

## Assertions
Checking if a element is visible

```ts
 await expect(anyElement).toBeVisible();
 ```
