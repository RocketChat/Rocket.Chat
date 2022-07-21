import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel, Auth } from './page-objects';

test.describe('Channel Creation', () => {
	let pageTestContext: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		pageTestContext = page;
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeEach(async () => {
		await pageAuth.doLogin();
	});

	test('expect create public channel', async () => {
		const name = faker.animal.type() + Date.now();

		await pageHomeChannel.sidenav.btnCreate.click();
		await pageHomeChannel.sidenav.createOptionByText('Channel').click();
		await pageHomeChannel.sidenav.checkboxChannelType.click();
		await pageHomeChannel.sidenav.inputChannelName.type(name);
		await pageHomeChannel.sidenav.btnCreateChannel.click();

		await expect(pageTestContext).toHaveURL(`/channel/${name}`);
	});

	test('expect create private channel', async () => {
		const name = faker.animal.type() + Date.now();

		await pageHomeChannel.sidenav.btnCreate.click();
		await pageHomeChannel.sidenav.createOptionByText('Channel').click();
		await pageHomeChannel.sidenav.inputChannelName.type(name);
		await pageHomeChannel.sidenav.btnCreateChannel.click();

		await expect(pageTestContext).toHaveURL(`/group/${name}`);
	});
});
