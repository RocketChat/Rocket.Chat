import { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { LoginPage, FlexTab, SideNav, MainContent } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Main Elements Render]', function () {
	let page: Page;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();

		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);
		flexTab = new FlexTab(page);

		await page.goto('/');
		await loginPage.doLogin(adminLogin);
	});

	test.describe('[Side Nav Bar]', () => {
		test.describe('[Render]', () => {
			test('expect show the new channel button', async () => {
				await expect(sideNav.btnSidebarCreate).toBeVisible();
			});

			test('expect show "general" channel', async () => {
				await expect(sideNav.general).toBeVisible();
			});
		});

		test.describe('[Spotlight search bar]', () => {
			test('expect show spotlight search bar', async () => {
				await sideNav.spotlightSearchIcon.click();
				await expect(sideNav.spotlightSearch).toBeVisible();
			});

			test('expect click the spotlight and show the channel list', async () => {
				await sideNav.spotlightSearch.click();
				await expect(sideNav.spotlightSearchPopUp).toBeVisible();
			});

			test('expect add text to the spotlight and show the channel list', async () => {
				await sideNav.spotlightSearch.type('rocket.cat');
				await expect(sideNav.spotlightSearchPopUp).toBeVisible();
				await page.locator('//*[@data-qa="sidebar-search-result"]//*[@data-index="0"]').click();
			});
		});
	});
	test.describe('[User Options]', () => {
		test.describe('[Render]', () => {
			test.beforeEach(async () => {
				await sideNav.sidebarUserMenu.click();
			});

			test.afterEach(async () => {
				await sideNav.sidebarUserMenu.click();
			});

			test('expect show online button', async () => {
				await expect(sideNav.statusOnline).toBeVisible();
			});

			test('expect show away button', async () => {
				await expect(sideNav.statusAway).toBeVisible();
			});

			test('expect show busy button', async () => {
				await expect(sideNav.statusBusy).toBeVisible();
			});

			test('expect show offline button', async () => {
				await expect(sideNav.statusOffline).toBeVisible();
			});

			test('expect show my account button', async () => {
				await expect(sideNav.account).toBeVisible();
			});

			test('expect show logout button', async () => {
				await expect(sideNav.logout).toBeVisible();
			});
		});
	});

	test.describe('[Main Content]', () => {
		test.describe('[Render]', () => {
			test.beforeAll(async () => {
				await sideNav.doOpenChat('general');
			});

			test('expect show the title of the channel', async () => {
				await expect(mainContent.channelTitle('general')).toBeVisible();
			});

			test('expect show the empty favorite star (before)', async () => {
				await expect(mainContent.emptyFavoriteStar).toBeVisible();
			});

			test('expect click the empty star', async () => {
				await mainContent.emptyFavoriteStar.click();
			});

			test('expect show the filled favorite star', async () => {
				await expect(mainContent.favoriteStar).toBeVisible();
			});

			test('expect click the star', async () => {
				await mainContent.favoriteStar.click();
			});

			test('expect show the empty favorite star (after)', async () => {
				await expect(mainContent.emptyFavoriteStar).toBeVisible();
			});

			test('expect show the message input bar', async () => {
				await expect(mainContent.messageInput).toBeVisible();
			});

			test('expect show the message box actions button', async () => {
				await expect(mainContent.messageBoxActions).toBeVisible();
			});

			test('expect show the audio recording button', async () => {
				await expect(mainContent.recordBtn).toBeVisible();
			});

			test('expect show the emoji button', async () => {
				await expect(mainContent.emojiBtn).toBeVisible();
			});
			test('expect not show the Admin tag', async () => {
				await expect(mainContent.lastMessageUserTag).not.toBeVisible();
			});
		});
	});

	test.describe('[FlexTab]', () => {
		test.describe('[Render]', () => {
			test.beforeAll(async () => {
				await sideNav.doOpenChat('general');
			});

			test('expect to show tab info content', async () => {
				await flexTab.btnTabInfo.click();
				await expect(flexTab.contentTabInfo).toBeVisible();
				await flexTab.btnTabInfo.click();
			});

			test('expect to show tab thread content', async () => {
				await flexTab.btnTabSearch.click();
				await expect(flexTab.contentTabSearch).toBeVisible();
				await flexTab.btnTabSearch.click();
			});

			test('expect to show tab members content', async () => {
				await flexTab.btnTabMembers.click();
				await expect(flexTab.contentTabMembers).toBeVisible();
				await flexTab.btnTabMembers.click();
			});

			test('expect to show tab notifications content', async () => {
				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabNotifications.click();

				await expect(flexTab.contentTabNotifications).toBeVisible();

				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabNotifications.click();
			});

			test('expect to show tab files content', async () => {
				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabFiles.click();

				await expect(flexTab.contentTabFiles).toBeVisible();

				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabFiles.click();
			});

			test('expect to show tab mentions content', async () => {
				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabMentions.click();

				await expect(flexTab.contentTabMentions).toBeVisible();

				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabMentions.click();
			});

			test('expect to show tab stared content', async () => {
				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabStared.click();

				await expect(flexTab.contentTabStared).toBeVisible();

				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabStared.click();
			});

			test('expect to show tab pinned content', async () => {
				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabPinned.click();

				await expect(flexTab.contentTabPinned).toBeVisible();

				await flexTab.doOpenMoreOptionMenu();
				await flexTab.btnTabPinned.click();
			});
		});
	});
});
