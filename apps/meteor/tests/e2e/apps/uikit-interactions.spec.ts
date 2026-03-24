import type { Page } from '@playwright/test';

import { appUiKitRoomTest } from '../../data/apps/app-packages';
import { IS_EE } from '../config/constants';
import { installLocalTestPackage } from '../fixtures/insert-apps';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Apps > UIKit interactions data', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;

	let page: Page;

	test.beforeAll(async ({ browser }) => {
		await installLocalTestPackage(appUiKitRoomTest);

		page = await browser.newPage();
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat('general');
	});

	test.afterAll(async () => {
		await page.close();
	});

	test('should include correct data in executeBlockActionHandler when triggered in a message', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeBlockActionHandler when triggered in a contextual bar surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeBlockActionHandler when triggered in a modal surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a modal surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeViewSubmitHandler when triggered in a contextual bar surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a modal surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});

	test('should include correct data in executeViewClosedHandler when triggered in a contextual bar surface', async () => {
		test.fixme(true, 'validate that user, room, triggerId, and other properties have been logged correctly in the app logs');
	});
});
