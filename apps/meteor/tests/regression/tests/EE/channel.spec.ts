import { test, expect } from '@playwright/test';
import { login } from '../support/users/user'
import home from '../locators/home.json';
import createChannel from '../locators/createChannel.json';
import { deleteChannel } from '../support/channels/channel';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Create a Private Channel', async ({ page }) => {
  await page.locator(home.button.createNew).click();
  await page
    .getByTestId(home.dropdown.createNew)
    .getByText(home.text.channel)
    .click();
  await page
    .getByPlaceholder(createChannel.placeholder.channelName)
    .fill(createChannel.names.channel);
  await page.getByRole('button', { name: createChannel.button.create }).click();

  expect(
    await page.getByRole('link', { name: createChannel.names.channel }).isVisible()
  );
});

test('Create a Public Channel', async ({ page }) => {
  await page.locator(home.button.createNew).click();
  await page
    .getByTestId(home.dropdown.createNew)
    .getByText(home.text.channel)
    .click();
  await page
    .getByPlaceholder(createChannel.placeholder.channelName)
    .fill(createChannel.names.channel);
  await page.locator(createChannel.toggle.private).first().click();
  await page.getByRole('button', { name: createChannel.button.create }).click();

  expect(
    await page.getByRole('link', { name: createChannel.names.channel }).isVisible()
  );
});

test.afterEach(async ({ page }) => {
  await deleteChannel(page, createChannel.names.channel);
});
