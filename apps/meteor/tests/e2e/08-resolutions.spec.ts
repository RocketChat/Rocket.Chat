import { test, expect, Browser, Page } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { Login, MainContent, SideNav } from './page-objects';

let page: Page;
let login: Login;
let mainContent: MainContent;
let sideNav: SideNav;

async function initConfig(browser: Browser, options = { viewport: { width: 650, height: 800 } }): Promise<any> {
	const context = await browser.newContext(options);
	page = await context.newPage();
	login = new Login(page);
	await page.goto('/');

	await login.doLogin(adminLogin);
	sideNav = new SideNav(page);
	mainContent = new MainContent(page);
	return { login, sideNav, mainContent };
}

test.describe('[Resolution]', () => {
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
			await expect(position?.x).toEqual(0);
			await expect(await sideNav.isSideBarOpen()).toBeFalsy;
		});

		test.describe('moving elements:', async () => {
			test.beforeEach(async () => {
				if (!(await sideNav.isSideBarOpen())) {
					await sideNav.btnBurger.click({ force: true });
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
				await sideNav.doOpenChannel('general');
				await expect(await sideNav.isSideBarOpen()).toBeFalsy;
			});

			test.describe('Preferences', async () => {
				test.beforeAll(async () => {
					if (!(await sideNav.isSideBarOpen())) {
						await sideNav.btnBurger.click({ force: true });
					}

					await sideNav.sidebarUserMenu.click();
					await sideNav.account.click();
				});

				test.afterEach(async () => {
					await sideNav.returnToMenuInLowResolution.click();
				});

				test('expect close the sidenav when press the preferences link', async () => {
					await sideNav.preferences.click();
					await page.mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeTruthy;
				});

				test('expect close the sidenav when press the profile link', async () => {
					await sideNav.profile.click();
					await page.mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeTruthy;
				});

				test('expect close the preferences nav', async () => {
					await sideNav.preferencesClose.click();
					await page.mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeFalsy;
				});
			});
		});
	});
});
