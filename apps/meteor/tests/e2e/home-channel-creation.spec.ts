import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel, Auth } from './page-objects';

test.describe('Channel Creation', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async () => {
		await pageAuth.doLogin();
	});

	test('expect create public channel', async () => {
		const name = faker.animal.type() + Date.now();

		await pageHomeChannel.sidebar.btnCreate.click();
		await pageHomeChannel.sidebar.btnOptionChannel.click();
		await pageHomeChannel.sidebar.checkboxChannelType.click();
		await pageHomeChannel.sidebar.inputChannelName.type(name);
		await pageHomeChannel.sidebar.btnCreateChannel.click();

		await expect(page).toHaveURL(`/channel/${name}`);
	});

	test('expect create private channel', async () => {
		const name = faker.animal.type() + Date.now();

		await pageHomeChannel.sidebar.btnCreate.click();
		await pageHomeChannel.sidebar.btnOptionChannel.click();
		await pageHomeChannel.sidebar.inputChannelName.type(name);
		await pageHomeChannel.sidebar.btnCreateChannel.click();

		await expect(page).toHaveURL(`/group/${name}`);
	});
});
