import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import FlexTab from './utils/pageobjects/flex-tab.page';
import LoginPage from './utils/pageobjects/login.page';
import { adminUsername, adminPassword } from './utils/mocks/userAndPasswordMock';

const username = adminUsername;

test.describe('[Main Elements Render]', function () {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;

	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
		await loginPage.login({ email: adminUsername, password: adminPassword });
		sideNav = new SideNav(browser, baseURL as string, loginPage.getPage());
		mainContent = new MainContent(browser, baseURL as string, loginPage.getPage());
		flexTab = new FlexTab(browser, baseURL as string, loginPage.getPage());
	});

	test.describe('[Side Nav Bar]', () => {
		test.describe('render:', () => {
			test('expect show the new channel button', async () => {
				await expect(sideNav.newChannelBtnToolbar()).toBeVisible();
			});

			test('expect show "general" channel', async () => {
				await expect(sideNav.general()).toBeVisible();
			});
		});

		test.describe('spotlight search render:', () => {
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
		test.describe('render:', () => {
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

	test.describe.only('[Main Content]', () => {
		test.describe('render:', () => {
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

			test('expect show the last message', async () => {
				await expect(mainContent.lastMessage()).toBeVisible();
			});

			test('expect be that the last message is from the logged user', async () => {
				await expect(mainContent.lastMessageUser()).toContainText(username);
			});

			test('expect not show the Admin tag', async () => {
				await expect(mainContent.lastMessageUserTag()).not.toBeVisible();
			});
		});
	});

	test.describe('[Flextab]', () => {
		test.describe('[Render]', () => {
			test.beforeAll(async () => {
				await sideNav.openChannel('general');
			});

			test.describe('Room Info Tab:', () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
				});

				test.afterAll(() => {
					flexTab.operateFlexTab('info', false);
				});

				test('expect show the room info button', () => {
					flexTab.channelTab.should('be.visible');
				});

				test('expect show the room info tab content', () => {
					flexTab.channelSettings.should('be.visible');
				});

				it.skip('expect show the room name', () => {
					flexTab.channelSettingName.should('have.attr', 'title', 'general');
				});
			});
		}); // remove
	}); // remove
}); // remove
	// 		describe('Search Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('search', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('search', false);
	// 			});

	// 			test('expect show the message search  button', () => {
	// 				flexTab.searchTab.should('be.visible');
	// 			});

	// 			test('expect show the message tab content', () => {
	// 				flexTab.searchTabContent.should('be.visible');
	// 			});
	// 		});

	// 		describe('Members Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('members', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('members', false);
	// 			});

	// 			test('expect show the members tab button', () => {
	// 				flexTab.membersTab.should('be.visible');
	// 			});

	// 			test('expect show the members content', () => {
	// 				flexTab.membersTabContent.should('be.visible');
	// 			});
	// 		});

	// 		describe('Notifications Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('notifications', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('notifications', false);
	// 			});

	// 			test('expect not show the notifications button', () => {
	// 				flexTab.notificationsTab.should('not.exist');
	// 			});

	// 			test('expect show the notifications Tab content', () => {
	// 				flexTab.notificationsSettings.should('be.visible');
	// 			});
	// 		});

	// 		describe('Files Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('files', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('files', false);
	// 			});

	// 			test('expect show the files Tab content', () => {
	// 				flexTab.filesTabContent.should('be.visible');
	// 			});
	// 		});

	// 		describe('Mentions Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('mentions', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('mentions', false);
	// 			});

	// 			test('expect show the mentions Tab content', () => {
	// 				flexTab.mentionsTabContent.should('be.visible');
	// 			});
	// 		});

	// 		describe('Starred Messages Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('starred', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('starred', false);
	// 			});

	// 			test('expect show the starred messages Tab content', () => {
	// 				flexTab.starredTabContent.should('be.visible');
	// 			});
	// 		});

	// 		describe('Pinned Messages Tab:', () => {
	// 			before(() => {
	// 				flexTab.operateFlexTab('pinned', true);
	// 			});

	// 			after(() => {
	// 				flexTab.operateFlexTab('pinned', false);
	// 			});

	// 			test('expect show the pinned messages Tab content', () => {
	// 				flexTab.pinnedTabContent.should('be.visible');
	// 			});
	// 		});
	// 	});
	// });
// });
