import { test, expect, request } from '@playwright/test';
import { login } from '../support/users/user';
import home from '../locators/home.json';
import createDiscussion from '../locators/createDiscussion.json';
import { deleteDiscussion, deleteDiscussionAPI } from '../support/discussions/discussion';
import { createChannelAPI, deleteChannel } from '../support/channels/channel';

test.beforeEach(async ({ page, request }) => {
  await createChannelAPI(request, createDiscussion.names.channel); 
  await login(page);
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
