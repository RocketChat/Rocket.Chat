import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import LoginPage from './utils/pageobjects/login.page';
import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { LOCALHOST } from './utils/mocks/urlMock';

test.describe('[Resolution]', function () {
	test.describe('[Mobile Render]', async () => {
		let loginPage: LoginPage;
		let mainContent: MainContent;
		let sideNav: SideNav;

		test.beforeAll(async ({ browser, baseURL }) => {
			const context = await browser.newContext({ viewport: { width: 650, height: 800 } });
			const page = await context.newPage();
			const URL = baseURL || LOCALHOST;
			loginPage = new LoginPage(page);
			await loginPage.goto(URL);

			await loginPage.login(adminLogin);
			sideNav = new SideNav(page);
			mainContent = new MainContent(page);
		});

		test.afterAll(async ({ browser, baseURL }) => {
			const context = await browser.newContext({ viewport: { width: 1600, height: 1600 } });
			const page = await context.newPage();
			const URL = baseURL || LOCALHOST;
			loginPage = new LoginPage(page);
			await loginPage.goto(URL);

			await loginPage.login(adminLogin);
			sideNav = new SideNav(page);
			mainContent = new MainContent(page);

			await expect(sideNav.spotlightSearchIcon()).toBeVisible();
		});

		test('expect close the sidenav', async () => {
			const position = await mainContent.mainContent().boundingBox();
			await expect(position?.x).toEqual(0);
			await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'false');
		});

		test.describe('moving elements:', async () => {
			test.beforeEach(async () => {
				const isDataQaOpened = (await sideNav.sideNavBar().getAttribute('data-qa-opened')) === 'true';

				if (!isDataQaOpened) {
					await sideNav.burgerBtn().click({ force: true });
				}
			});

			test('expect open the sidenav', async () => {
				const position = await mainContent.mainContent().boundingBox();
				await expect(position?.x).toEqual(0);
				await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'true');
			});

			test('expect not close sidebar on pressing the sidebar item menu', async () => {
				await sideNav.firstSidebarItemMenu().click();

				const position = await mainContent.mainContent().boundingBox();
				await expect(position?.x).toEqual(0);

				await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'true');
			});

			test('expect close the sidenav when open general channel', async () => {
				await sideNav.openChannel('general');
				await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'false');
			});

			// Skipped because it's not closing sidebar after opening an item
			test.describe('Preferences', async () => {
				// test.beforeEach(async () => {
				// 	const isDataQaOpened = (await sideNav.sideNavBar().getAttribute('data-qa-opened')) === 'true';
				//
				// 	if (!isDataQaOpened) {
				// 		await sideNav.burgerBtn().click({ force: true });
				// 	}
				// });

				test.skip('expect open the user preferences screen', async () => {
					await sideNav.sidebarUserMenu().click();
					await sideNav.account().click();
				});

				test.skip('expect close the sidenav when press the preferences link', async () => {
					await sideNav.preferences().click();
					await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'true');
				});

				test.skip('expect close the sidenav when press the profile link', async () => {
					await sideNav.profile().click();
					await expect(sideNav.sideNavBar()).not.toHaveAttribute('data-qa-opened', 'true');
				});

				test.skip('expect close the preferences nav', async () => {
					await sideNav.preferencesClose().click();
				});
			});
		});
	});
});
