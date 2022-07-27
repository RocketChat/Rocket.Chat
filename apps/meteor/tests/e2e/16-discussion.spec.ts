import { test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { v4 as uuid } from 'uuid';

import { Auth, HomeDiscussion } from './page-objects';

test.describe('[Discussion]', () => {
	let pageAuth: Auth;
	let pageHomeDiscussion: HomeDiscussion;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeDiscussion = new HomeDiscussion(page);
	});

	test.beforeEach(async () => {
		await pageAuth.doLogin();
	});

	test.describe('[Create discussion from screen]', () => {
		test('expect discussion is created', async () => {
			const anyDiscussionName = faker.animal.type() + Date.now();
			const anyMessage = faker.animal.type();

			await pageHomeDiscussion.sidenav.btnCreate.click();
			await pageHomeDiscussion.doCreateDiscussion('room_public1', anyDiscussionName, anyMessage);
		});
	});

	test.describe.skip('[Create discussion from context menu]', () => {
		const anyMessage = faker.animal.type() + uuid();

		test.beforeAll(async () => {
			await pageHomeDiscussion.sidenav.doOpenChat('room_public1');
			await pageHomeDiscussion.content.doSendMessage(anyMessage);
		});

		test('expect show a dialog for starting a discussion', async ({ page }) => {
			await page.waitForLoadState('domcontentloaded', { timeout: 3000 });
			await pageHomeDiscussion.content.doOpenMessageActionMenu();
			await pageHomeDiscussion.doCreateDiscussionInContext(anyMessage);
		});
	});
});
