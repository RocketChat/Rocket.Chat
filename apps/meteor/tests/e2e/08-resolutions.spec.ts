import { Browser } from '@playwright/test';

import { test, expect } from './utils/test';
import { Global, MainContent, SideNav, LoginPage } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

let loginPage: LoginPage;
let mainContent: MainContent;
let sideNav: SideNav;
let global: Global;

async function initConfig(browser: Browser, options = { viewport: { width: 650, height: 800 } }): Promise<any> {
	const page = await browser.newPage(options);
	loginPage = new LoginPage(page);
	sideNav = new SideNav(page);
	mainContent = new MainContent(page);
	global = new Global(page);

	await page.goto('/');
	await loginPage.doLogin(adminLogin);
	return { loginPage, sideNav, mainContent };
}

test.describe('[Resolution]', function () {
	test.describe('[Mobile Render]', async () => {
		test.beforeAll(async ({ browser }) => {
			await initConfig(browser);
		});

		test.afterAll(async ({ browser }) => {
			await initConfig(browser, { viewport: { width: 1600, height: 1600 } });

			await expect(sideNav.spotlightSearchIcon).toBeVisible();
		});

		test('expect close the sidenav', async () => {
			const position = await mainContent.mainContent.boundingBox();
			expect(position?.x).toEqual(0);
			expect(await sideNav.isSideBarOpen()).toBeFalsy;
		});

		test.describe('moving elements:', async () => {
			test.beforeEach(async () => {
				if (!(await sideNav.isSideBarOpen())) {
					await sideNav.burgerBtn.click({ force: true });
				}
			});

			test('expect open the sidenav', async () => {
				const position = await mainContent.mainContent.boundingBox();
				expect(position?.x).toEqual(0);
				expect(await sideNav.isSideBarOpen()).toBeTruthy;
			});

			test('expect not close sidebar on pressing the sidebar item menu', async () => {
				await sideNav.firstSidebarItemMenu.click();

				const position = await mainContent.mainContent.boundingBox();
				expect(position?.x).toEqual(0);

				expect(await sideNav.isSideBarOpen()).toBeTruthy;

				await sideNav.firstSidebarItemMenu.click();
			});

			test('expect close the sidenav when open general channel', async () => {
				await sideNav.doOpenChat('general');
				expect(await sideNav.isSideBarOpen()).toBeFalsy;
			});

			test.describe('Preferences', async () => {
				test.beforeAll(async () => {
					if (!(await sideNav.isSideBarOpen())) {
						await sideNav.burgerBtn.click({ force: true });
					}

					await sideNav.sidebarUserMenu.click();
					await sideNav.account.click();
				});

				test.afterEach(async () => {
					await sideNav.returnToMenuInLowResolution.click();
				});

				test.skip('expect close the sidenav when press the preferences link', async () => {
					await sideNav.preferences.click();
					await expect(global.flexNav).toBeHidden();
				});

				test.skip('expect close the sidenav when press the profile link', async () => {
					await sideNav.profile.click();
					await expect(sideNav.flexNav).toBeHidden();
				});

				test.skip('expect close the preferences nav', async () => {
					await sideNav.preferencesClose.click();
					await expect(sideNav.flexNav).toBeHidden();
				});
			});
		});
	});
});
