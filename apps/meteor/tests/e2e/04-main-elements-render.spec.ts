import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import FlexTab from './utils/pageobjects/FlexTab';
import LoginPage from './utils/pageobjects/LoginPage';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Main Elements Render]', function () {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;

	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		const URL = baseURL;
		loginPage = new LoginPage(page);
		await loginPage.goto(URL as string);

		await loginPage.login(adminLogin);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);
		flexTab = new FlexTab(page);
	});

	test.afterAll(async () => {
		await loginPage.closePage();
		await mainContent.closePage();
		await sideNav.closePage();
		await flexTab.closePage();
	});

	test.describe('[Side Nav Bar]', () => {
		test.describe('[Render]', () => {
			test('expect show the new channel button', async () => {
				await expect(sideNav.newChannelBtnToolbar()).toBeVisible();
			});

			test('expect show "general" channel', async () => {
				await expect(sideNav.general()).toBeVisible();
			});
		});

		test.describe('[Spotlight search bar]', () => {
			test('expect show spotlight search bar', async () => {
				await sideNav.spotlightSearchIcon().click();
				await expect(sideNav.spotlightSearch()).toBeVisible();
			});

			test('expect click the spotlight and show the channel list', async () => {
				await sideNav.spotlightSearch().click();
				await expect(sideNav.spotlightSearchPopUp()).toBeVisible();
			});

			test('expect add text to the spotlight and show the channel list', async () => {
				await sideNav.spotlightSearch().type('rocket.cat');
				await expect(sideNav.spotlightSearchPopUp()).toBeVisible();
				await sideNav.getPage().locator('//*[@data-qa="sidebar-search-result"]//*[@data-index="0"]').click();
			});
		});
	});
	test.describe('[User Options]', () => {
		test.describe('[Render]', () => {
			test.beforeEach(async () => {
				await sideNav.sidebarUserMenu().click();
			});

			test.afterEach(async () => {
				await sideNav.sidebarUserMenu().click();
			});

			test('expect show online button', async () => {
				await expect(sideNav.statusOnline()).toBeVisible();
			});

			test('expect show away button', async () => {
				await expect(sideNav.statusAway()).toBeVisible();
			});

			test('expect show busy button', async () => {
				await expect(sideNav.statusBusy()).toBeVisible();
			});

			test('expect show offline button', async () => {
				await expect(sideNav.statusOffline()).toBeVisible();
			});

			test('expect show my account button', async () => {
				await expect(sideNav.account()).toBeVisible();
			});

			test('expect show logout button', async () => {
				await expect(sideNav.logout()).toBeVisible();
			});
		});
	});

	test.describe('[Main Content]', () => {
		test.describe('[Render]', () => {
			test.beforeAll(async () => {
				await sideNav.openChannel('general');
			});

			test('expect show the title of the channel', async () => {
				await expect(mainContent.channelTitle('general')).toBeVisible();
			});

			test('expect show the empty favorite star (before)', async () => {
				await expect(mainContent.emptyFavoriteStar()).toBeVisible();
			});

			test('expect click the empty star', async () => {
				await mainContent.emptyFavoriteStar().click();
			});

			test('expect show the filled favorite star', async () => {
				await expect(mainContent.favoriteStar()).toBeVisible();
			});

			test('expect click the star', async () => {
				await mainContent.favoriteStar().click();
			});

			test('expect show the empty favorite star (after)', async () => {
				await expect(mainContent.emptyFavoriteStar()).toBeVisible();
			});

			test('expect show the message input bar', async () => {
				await expect(mainContent.messageInput()).toBeVisible();
			});

			test('expect show the message box actions button', async () => {
				await expect(mainContent.messageBoxActions()).toBeVisible();
			});

			// issues with the new message box action button and the no animations on tests

			test('expect show the audio recording button', async () => {
				await expect(mainContent.recordBtn()).toBeVisible();
			});

			test('expect show the emoji button', async () => {
				await expect(mainContent.emojiBtn()).toBeVisible();
			});
			test.skip('expect not show the Admin tag', async () => {
				await expect(mainContent.lastMessageUserTag()).not.toBeVisible();
			});
		});
	});

	test.describe('[FlexTab]', () => {
		test.describe('[Render]', () => {
			test.beforeAll(async () => {
				await sideNav.openChannel('general');
			});

			test.describe('[Room tab info]', () => {
				test('expect room tab info is visible', async () => {
					await flexTab.operateFlexTab2('[data-qa="ToolBoxVisibleActions-Room_Info"]', '[data-qa="RoomInfoVerticalBarText"]');
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Search Tab]', () => {
				test('expect show search message content', async () => {
					await flexTab.operateFlexTab2(
						'[data-qa="ToolBoxVisibleActions-Search_Messages"]',
						'[data-qa="VerticalBarHeader"] >> text=Search Messages',
					);
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Members Tab]', () => {
				test('expect show search message content', async () => {
					await flexTab.operateFlexTab2('[data-qa="ToolBoxVisibleActions-Members"]', '[data-qa="VerticalBarHeader"] >> text=Members');
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Notifications Tab]', () => {
				test('expect show notifications tab content', async () => {
					await flexTab.operateFlexTab2(
						'[data-qa="ToolBoxOption-NotificationsPreferences"]',
						'[data-qa="VerticalBarHeader"] >> text=Notifications Preferences',
						true,
					);
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Files Tab]', () => {
				test('expect show file tab content', async () => {
					await flexTab.operateFlexTab2('[data-qa="ToolBoxVisibleActions-Files"]', '[data-qa="VerticalBarHeader"] >> text=Files');
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Mentions Tab]', () => {
				test('expect show mentions tab content', async () => {
					await flexTab.operateFlexTab2('[data-qa="ToolBoxOption-Mentions"]', '[data-qa="VerticalBarHeader"] >> text=Mentions', true);
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Starred Messages Tab]', () => {
				test('expect show starred message tab content', async () => {
					await flexTab.operateFlexTab2(
						'[data-qa="ToolBoxOption-StarredMessages"]',
						'[data-qa="VerticalBarHeader"] >> text=Starred Messages',
						true,
					);
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});

			test.describe('[Pinned Messages Tab]', () => {
				test('expect show pinned message tab content', async () => {
					await flexTab.operateFlexTab2(
						'[data-qa="ToolBoxOption-PinnedMessages"]',
						'[data-qa="VerticalBarHeader"] >> text=Pinned Messages',
						true,
					);
					await flexTab.getPage().locator('[data-qa="VerticalBarClose"]').click();
				});
			});
		});
	});
});
