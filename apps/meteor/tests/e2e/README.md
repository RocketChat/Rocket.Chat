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
- `PWDEBUG=1` Control the test execution

## Page Objects
- Any locator name must start with of one the following prefixes: `btn`, `link`, `input`, `select`, `checkbox`, `text`

## Important links
- [playwright docs](https://playwright.dev/docs/intro)

## Assertions
Checking if a element is visible

```ts
 await expect(anyElement).toBeVisible();
 ```

# Playwright Locator Best Practices

## Preferred locator types:

### 1. By role `.getByRole()`:
This is the most recommended locator type. 
- It ensures our element is accessible to screen readers and other assistive technologies.
- It ensures that the element is uniquely identifiable.
- It's recommended to use the `exact` option to ensure that the locator doesn't match any other element with the same role


```ts
await page.getByRole('button', { name: 'Save', exact: true });

// Without the `exact` option, Playwright would match buttons with 'Save' and 'Save changes' labels.
```


### 2. By text `.getByText()` or `.getByLabel()`:
- Use this when locating by role is not possible or not sufficient.
- Be sure to restrict the scope of the locator to the element you are looking for.

### 3. Locator with `has`:
Our input elements hide the native input and render a custom component.

To target the input and trigger changes, you should locate the label that wraps the input and use the `has` locator.
```ts
page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
```

## Locator types to avoid (at all costs):
If you are not able to find the element by role, label or text, it's a sign that the element is not accessible to the user.
The component should be refactored to allow a more accessible locator.
### 1. By `data-qa-id` or testId `.getByTestId()`:
```ts
// DON'T ❌ 
page.locator('[data-qa-id="menu-more-actions"]'); 

// DO ✅
page.getByRole('menu', {name: 'More actions', exact: true }); 
```

### 2. By elements and class names `.locator('div.class-name')`:
The HTML structure and/or class names can easily change over time, so it's better to use the locator by role and name.

```ts
// DON'T ❌
page.locator('#modal-root .rcx-button-group--align-end .rcx-button--primary');

// #modal-root was used to locate the injected portal element for the modal.
// This can be better located by role 'dialog' and making sure the modal has the proper name attribute.

// DO ✅
page.getByRole('dialog', name: 'Modal name example').getByRole('button', { name: 'Confirm', exact: true });
```

### 3. By position:
Using `nth-child` or similar selectors is not recommended as it can easily change.
It's a fragile locator and it's hard to maintain.

### 4. Parent/Child relationships: 
A change in the DOM structure can break the test.

## Use our page-objects:
> apps/meteor/tests/e2e/page-objects
- page-objects are a great way to reuse locators across tests using `getters` and `methods`.
- They make it easier to write tests that are more readable and maintainable.
- Always make sure to use the most restricted scope possible - not the whole page to avoid multiple matches.

If you are writing a new test, make sure to look at the existing page-objects to see if there is a suitable one for your use case.

If not, evaluate if creating a reusable getter/method is worth it and create the ones you need in the respective context.


E.g.:
Writing a new test for a sidebar behavior.
- check `apps/meteor/tests/e2e/page-objects/fragments/sidebar.ts` if the fragments you need are already there.
- If not, create new getters and/or methods in this file.

Usage example:

```ts
// apps/meteor/tests/e2e/page-objects/fragments/sidebar.ts
// ...

	get sidebar(): Locator {
		return this.page.getByRole('navigation', { name: 'sidebar' });
	}

	get channelsList(): Locator {
		return this.sidebar.getByRole('list', { name: 'Channels' });
	}

  // Restricted scope: inside navigation > sidebar > list named Channels > link with name
	getSearchRoomByName(name: string) {
		return this.channelsList.getByRole('link', { name });
	}
```

```ts
// test.spec.ts

  test('should display sidebar items', async ({ page }) => {
      poHomeChannel = new HomeChannel(page);
      await page.goto('/home');
      const targetChannel = 'channel-test';

      await expect(poHomeChannel.sidebar.getSearchRoomByName(targetChannel)).toBeVisible();
  });
```

## Cleanup after tests
- Remember to delete all users, channels, rooms, etc, created during the tests.
- Reset settings to their default values after the tests, if changed.
- Close all new pages opened during the tests.
- You can use the `test.afterAll()` or `test.afterEach()` methods to clean up after the tests.


```ts
// test.spec.ts

test.describe.serial('feature example', ({ api}) => {
	  let targetChannel;
	  let targetDiscussion;

    test.beforeAll(async ({ api }) => {
      // change setting value
		  await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);

      // create channel
      targetChannel = await createTargetChannel(api, { members: ['user1'] });

      // create discussion
      targetDiscussion = await createTargetDiscussion(api);
    });
    test.afterAll(async ({ api }) => {
      // reset setting value
		  await setSettingValueById(api, 'Accounts_AllowFeaturePreview', false);

      // delete  channel
      await deleteChannel(api, targetChannel);

      // delete discussion
      await deleteRoom(api, targetDiscussion._id);
    });
})
```

## General recommendations

### Use `test.describe` for grouping tests
It can be used to group related tests into a test suite. It provides a way to organize tests logically and improve the readability and maintainability of your test code.
```ts
test.describe('Feature Test', () => {
  test('should show feature test', async ({ api}) => {
    // do some tests
  });
});
```

### Use `test.step` for grouping steps
Enhances test readability and provides more detailed information in test reports
```ts
test.describe('Feature Test', () => {
  test.step('should show feature test', async ({ api}) => {
    // do some tests
  });
});
```

### Big test files should not be `.serial`:
- Ok for tests with very few steps, when steps have dependencies on each other, you can simulate the user flow sequentially.
- Avoid chaining big tests with `test.serial` - dependant steps make it harder to debug and/or make small changes
> If you are changing something on the 34th step, you would have to run the whole test suite multiple times during development, instead of olny running the test step in question.

## Performance patterns

E2E tests are the most expensive tests we run. Two patterns, applied together, typically cut a suite's runtime by ~80% and remove the most common sources of flake. They are the standard for new suites and the target for migrating existing ones.

### Pattern 1 — seed state through the API, not the UI

Use the browser **only for what the test actually verifies**. Everything else — creating rooms, DMs, discussions, threads, sending setup messages — goes through REST.

Why:
- A REST call costs 30–150ms; the equivalent UI flow (menu → modal → input → submit → wait for nav) costs 2–8s per step.
- API errors are deterministic and synchronous. UI errors manifest as timeouts on overloaded CI, which is a slow and ambiguous signal.
- The test fails only when the feature under test breaks, not when an unrelated setup UI regresses. A broken "create discussion" modal should not take down every test that needs a discussion as fixture.
- Removes the most flake-prone interactions: hover-revealed menus, modal animations, search debounces.

Do **not** apply when the setup UI is the actual subject of the test (`create-direct.spec.ts`, `create-discussion.spec.ts`, `create-channel.spec.ts`, etc.). There, keep one test per creation flow going through the UI; unrelated tests rely on the API path.

### Pattern 2 — share the browser context across a serial suite

For suites already using `test.describe.serial`, move `browser.newContext()`, `page.goto()` and the initial room navigation from `beforeEach` to `beforeAll`.

Why: bootstrapping a Playwright context plus hydrating the Meteor app costs ~1.5–2.5s per test. In a serial suite the isolation cost is already paid — collecting the speed benefit is free.

Preconditions:
- Suite is `test.describe.serial`.
- All tests share the same user / storage state.
- Each test leaves the page in a known "home position" (base room open, no modals, threads, or side panels lingering).

Do **not** apply when:
- Tests need different users or storage states.
- Suite covers auth, 2FA, or session lifecycle — the browser state is the subject.
- Suite has more than ~15 tests: the debug cost of shared state outgrows the speed win (see "Big test files should not be `.serial`" above).

## API helpers for state seeding

Prefer these helpers in `beforeAll` / `beforeEach` and in setup `test.step`s. All live under `apps/meteor/tests/e2e/utils/`.

| Intent                               | Helper                                                    | REST endpoint             |
| ------------------------------------ | --------------------------------------------------------- | ------------------------- |
| Create public channel                | `createTargetChannel(api)`                                | `/channels.create`        |
| Create public channel (full room)    | `createTargetChannelAndReturnFullRoom(api)`               | `/channels.create`        |
| Create private channel               | `createTargetPrivateChannel(api)`                         | `/groups.create`          |
| Create private group (full room)     | `createTargetGroupAndReturnFullRoom(api)`                 | `/groups.create`          |
| Create team                          | `createTargetTeam(api)`                                   | `/teams.create`           |
| Create discussion (fresh parent)     | `createTargetDiscussion(api)`                             | `/rooms.createDiscussion` |
| Create discussion on existing msg    | `createDiscussion(api, parentRoomId, parentMsgId, name)`  | `/rooms.createDiscussion` |
| Create DM room (get id back)         | `createDirectMessageRoom(api, username)`                  | `/im.create`              |
| Send message to a room               | `sendMessage(api, roomId, msg)`                           | `/chat.sendMessage`       |
| Send message inside a thread         | `sendMessage(api, roomId, msg, parentMsgId)`              | `/chat.sendMessage`       |
| Send message as a specific user      | `sendMessageFromUser(request, user, rid, msg)`            | `/chat.postMessage`       |
| Delete channel (by name)             | `deleteChannel(api, roomName)`                            | `/channels.delete`        |
| Delete room (by id)                  | `deleteRoom(api, roomId)`                                 | `/rooms.delete`           |
| Delete team                          | `deleteTeam(api, teamName)`                               | `/teams.delete`           |

If the helper you need is missing, add it under `utils/` and re-export it from `utils/index.ts` rather than inlining the REST call in the spec.

## Template: optimized `.serial` suite

Copy-paste starting point for a new suite that applies both patterns.

```ts
import type { Page, BrowserContext } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, sendMessage } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Feature X', () => {
    let poHomeChannel: HomeChannel;
    let targetChannel: string;
    let targetChannelId: string;
    let page: Page;
    let context: BrowserContext;

    test.beforeAll(async ({ browser, api }) => {
        targetChannel = await createTargetChannel(api);
        const info = await (await api.get(`/channels.info?roomName=${targetChannel}`)).json();
        targetChannelId = info.channel._id;

        context = await browser.newContext();
        page = await context.newPage();
        poHomeChannel = new HomeChannel(page);

        await page.goto('/home');
        await poHomeChannel.navbar.openChat(targetChannel);
    });

    test.afterAll(async ({ api }) => {
        await api.post('/channels.delete', { roomName: targetChannel });
        await page.close();
        await context.close();
    });

    test('exercises the feature', async ({ api }) => {
        const messageText = 'seed';
        await sendMessage(api, targetChannelId, messageText);
        await expect(poHomeChannel.content.lastUserMessage).toContainText(messageText);
        // assertions for the feature under test
    });
});
```

## Migrating an existing suite

Recipe for a single spec. Keep PRs to at most 5 files so reviews stay tractable.

1. **Baseline**. Run the spec three times locally and record the median per-test time. Paste it in the PR body.
2. **Map setup**. For every test, mark each `test.step` and every `beforeEach` call that only prepares state (creates rooms, messages, threads, opens menus). These are candidates for API seeding.
3. **Apply Pattern 1**. Replace the marked UI setup with helpers from the table above. If a helper is missing, add it under `utils/` and export it from `utils/index.ts`.
4. **Apply Pattern 2** — only if the suite is `.serial` and the preconditions hold. Move context, page, navigation to `beforeAll`. Close page and context in `afterAll`. Ensure every test returns the page to the home position.
5. **Check coverage when consolidating**. If you merge tests (e.g. four formatting tests into one), confirm the merged test still asserts every behavior the originals covered. List the merges in the PR body.
6. **Compare**. Run three times again, record the new median. If the improvement is under 30%, revisit — the coupling may not be worth it.
7. **PR body must include**: before/after timings, the list of UI setups moved to API, and an explicit reason if you chose not to apply one of the patterns.

## Anti-patterns to flag in review

- `poHomeChannel.content.sendMessage(...)` used inside `beforeEach` or `beforeAll` — that is setup, should be `sendMessage(api, ...)`.
- Opening meatball menus or modals purely to create a discussion, thread, or DM as a setup step.
- `test.describe.serial` combined with `beforeEach(async ({ page }) => { await page.goto(...) })` — the context should be shared in `beforeAll`.
- New non-serial suites whose tests still each carry >3s of UI setup.
- Inline `api.post('/im.create', …)` / `api.post('/chat.sendMessage', …)` in a spec instead of extending the helpers in `utils/`.

