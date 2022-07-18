import { Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { v4 as uuid } from 'uuid';

import { test } from './utils/test';
import { MainContent, Discussion, LoginPage, SideNav } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Discussion]', () => {
	let page: Page;
	let loginPage: LoginPage;
	let discussion: Discussion;
	let sideNav: SideNav;
	let mainContent: MainContent;

	let message: string;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		loginPage = new LoginPage(page);
		discussion = new Discussion(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);

		await page.goto('/');
		await loginPage.doLogin(adminLogin);
	});

	test.describe('[Create discussion from screen]', () => {
		test('expect discussion is created', async () => {
			const discussionName = faker.animal.type() + Date.now();
			message = faker.animal.type();
			await sideNav.btnSidebarCreate.click();
			await discussion.doCreateDiscussion('public channel', discussionName, message);
		});
	});

	test.describe.skip('[Create discussion from context menu]', () => {
		test.beforeAll(async () => {
			message = faker.animal.type() + uuid();
			await sideNav.doOpenChat('public channel');
			await mainContent.sendMessage(message);
		});

		test('expect show a dialog for starting a discussion', async () => {
			await mainContent.page.waitForLoadState('domcontentloaded', { timeout: 3000 });
			await mainContent.openMessageActionMenu();
			await discussion.createDiscussionInContext(message);
		});
	});
});
