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
