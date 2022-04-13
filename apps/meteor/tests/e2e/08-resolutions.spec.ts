import { test, expect, Browser } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

let loginPage: LoginPage;
let mainContent: MainContent;
let sideNav: SideNav;

async function initConfig(
	browser: Browser,
	baseURL: string | undefined,
	options = { viewport: { width: 650, height: 800 } },
): Promise<any> {
	const context = await browser.newContext(options);
	const page = await context.newPage();
	const URL = baseURL as string;
	loginPage = new LoginPage(page);
	await loginPage.goto(URL);

	await loginPage.login(adminLogin);
	sideNav = new SideNav(page);
	mainContent = new MainContent(page);
	return { loginPage, sideNav, mainContent };
}

test.describe('[Resolution]', function () {
	test.describe('[Mobile Render]', async () => {
		test.beforeAll(async ({ browser, baseURL }) => {
			await initConfig(browser, baseURL);
		});

		test.afterAll(async ({ browser, baseURL }) => {
			await initConfig(browser, baseURL, { viewport: { width: 1600, height: 1600 } });

			await expect(sideNav.spotlightSearchIcon()).toBeVisible();
		});

		test('expect close the sidenav', async () => {
			const position = await mainContent.mainContent().boundingBox();
			await expect(position?.x).toEqual(0);
			await expect(await sideNav.isSideBarOpen()).toBeFalsy;
		});

		test.describe('moving elements:', async () => {
			test.beforeEach(async () => {
				if (!(await sideNav.isSideBarOpen())) {
					await sideNav.burgerBtn().click({ force: true });
				}
			});

			test('expect open the sidenav', async () => {
				const position = await mainContent.mainContent().boundingBox();
				await expect(position?.x).toEqual(0);
				await expect(await sideNav.isSideBarOpen()).toBeTruthy;
			});

			test('expect not close sidebar on pressing the sidebar item menu', async () => {
				await sideNav.firstSidebarItemMenu().click();

				const position = await mainContent.mainContent().boundingBox();
				await expect(position?.x).toEqual(0);

				await expect(await sideNav.isSideBarOpen()).toBeTruthy;

				await sideNav.firstSidebarItemMenu().click();
			});

			test('expect close the sidenav when open general channel', async () => {
				await sideNav.openChannel('general');
				await expect(await sideNav.isSideBarOpen()).toBeFalsy;
			});

			test.describe('Preferences', async () => {
				test.beforeAll(async () => {
					if (!(await sideNav.isSideBarOpen())) {
						await sideNav.burgerBtn().click({ force: true });
					}

					await sideNav.sidebarUserMenu().click();
					await sideNav.account().click();
				});

				test.afterEach(async () => {
					await sideNav.returnToMenuInLowResolution().click();
				});

				test('expect close the sidenav when press the preferences link', async () => {
					await sideNav.preferences().click();
					await sideNav.getPage().mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeTruthy;
				});

				test('expect close the sidenav when press the profile link', async () => {
					await sideNav.profile().click();
					await sideNav.getPage().mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeTruthy;
				});

				test('expect close the preferences nav', async () => {
					await sideNav.preferencesClose().click();
					await sideNav.getPage().mouse.click(640, 30);
					await expect(await sideNav.isSideBarOpen()).toBeFalsy;
				});
			});
		});
	});
});
