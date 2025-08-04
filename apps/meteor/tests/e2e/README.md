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
