import { expect, test } from '@playwright/test';
import createDiscussion from '../locators/createDiscussion.json';
import home from '../locators/home.json';
import { createChannelAPI, deleteChannel } from '../support/channels/channel';
import { deleteDiscussionAPI } from '../support/discussions/discussion';
test.use({ storageState: 'playwright/.auth/admin.json' });

test.beforeEach(async ({ page, request }) => {
  await createChannelAPI(request, createDiscussion.names.channel); 
  await page.goto(`${process.env.URL}`);
});

test('Create a discussion', async ({ page }) => {
  await page.locator(home.button.createNew).click();
  await page
    .getByTestId(home.dropdown.createNew)
    .getByText(home.text.discussion)
    .click();
  await page
    .getByPlaceholder(createDiscussion.placeholder.selectChannel)
    .fill(createDiscussion.names.channel)
  await page.getByRole('option', { name: createDiscussion.names.channel, exact: true }).locator('div').first().click();
  await page.getByPlaceholder(createDiscussion.placeholder.nameDiscussion).fill(createDiscussion.names.discussion);
  await page.getByRole('button', { name: createDiscussion.button.create }).click();

  expect(
    await page.getByRole('link', { name: createDiscussion.names.discussion }).isVisible()
  );
});

test.afterEach(async ({ page, request }) => {
  await deleteDiscussionAPI(request, createDiscussion.names.discussion);
  await deleteChannel(page, createDiscussion.names.channel);
});
