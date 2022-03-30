import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import FlexTab from './utils/pageobjects/flex-tab.page';
import LoginPage from './utils/pageobjects/login.page';

describe('[Main Elements Render]', function () {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;

	test.beforeAll(async ({ browser, baseURL }) => {
		loginPage = new LoginPage(browser, baseURL as string);
		await loginPage.open();
		await loginPage.login('user.test', 'user.test');
	});

	describe('[Side Nav Bar]', () => {
		describe('render:', () => {
			test('expect show the new channel button', () => {
				sideNav.newChannelBtnToolbar().should('be.visible');
			});

			test('expect show "general" channel', () => {
				sideNav.general().should('be.visible');
			});
		});

		describe('spotlight search render:', () => {
			after(() => {
				mainContent.messageInput.click();
			});
			test('expect show spotlight search bar', () => {
				sideNav.spotlightSearchIcon.click();
				sideNav.spotlightSearch.should('be.visible');
			});

			test('expect click the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.click('center');
				sideNav.spotlightSearchPopUp.should('be.visible');
			});

			it.skip('expect remove the list when the spotlight loses focus', () => {
				sideNav.spotlightSearchPopUp.should('be.visible');
				mainContent.messageInput.click();
				mainContent.lastMessage.click();
				sideNav.spotlightSearchPopUp.should('not.exist');
			});

			test('expect add text to the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.type('rocket.cat');
				sideNav.spotlightSearchPopUp.should('be.visible');
			});

			it.skip('expect remove the text on the spotlight and the list when lost focus', () => {
				sideNav.spotlightSearchPopUp.should('be.visible');
				mainContent.messageInput.click();
				sideNav.spotlightSearchPopUp.should('not.exist');
				sideNav.spotlightSearch.should('have.text', '');
			});
		});
	});

	describe('[User Options]', () => {
		describe('render:', () => {
			before(() => {
				sideNav.sidebarUserMenu.click();
			});

			after(() => {
				sideNav.sidebarUserMenu.click();
			});

			test('expect show online button', () => {
				sideNav.statusOnline.should('be.visible');
			});

			test('expect show away button', () => {
				sideNav.statusAway.should('be.visible');
			});

			test('expect show busy button', () => {
				sideNav.statusBusy.should('be.visible');
			});

			test('expect show offline button', () => {
				sideNav.statusOffline.should('be.visible');
			});

			test('expect show my account button', () => {
				sideNav.account.should('be.visible');
			});

			test('expect show logout button', () => {
				sideNav.logout.should('be.visible');
			});
		});
	});

	describe('[Main Content]', () => {
		describe('render:', () => {
			before(() => {
				sideNav.openChannel('general');
			});

			test('expect show the title of the channel', () => {
				mainContent.channelTitle.contains('general').should('be.visible');
			});

			test('expect show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.should('be.visible');
			});

			test('expect click the star', () => {
				mainContent.emptyFavoriteStar.click();
			});

			test('expect show the filled favorite star', () => {
				mainContent.favoriteStar.should('be.visible');
			});

			test('expect click the star', () => {
				mainContent.favoriteStar.click();
			});

			test('expect show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.should('be.visible');
			});

			test('expect show the message input bar', () => {
				mainContent.messageInput.should('be.visible');
			});

			test('expect show the message box actions button', () => {
				mainContent.messageBoxActions.should('be.visible');
			});

			// issues with the new message box action button and the no animations on tests

			test('expect show the audio recording button', () => {
				mainContent.recordBtn.should('be.visible');
			});

			test('expect show the emoji button', () => {
				mainContent.emojiBtn.should('be.visible');
			});

			test('expect show the last message', () => {
				mainContent.lastMessage.should('be.visible');
			});

			test('expect be that the last message is from the logged user', () => {
				mainContent.lastMessageUser.should('contain', username);
			});

			test('expect not show the Admin tag', () => {
				mainContent.lastMessageUserTag.should('not.exist');
			});
		});
	});

	describe('[Flextab]', () => {
		describe('[Render]', () => {
			before(() => {
				sideNav.openChannel('general');
			});

			describe('Room Info Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('info', true);
				});

				after(() => {
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

			describe('Search Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('search', true);
				});

				after(() => {
					flexTab.operateFlexTab('search', false);
				});

				test('expect show the message search  button', () => {
					flexTab.searchTab.should('be.visible');
				});

				test('expect show the message tab content', () => {
					flexTab.searchTabContent.should('be.visible');
				});
			});

			describe('Members Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('members', true);
				});

				after(() => {
					flexTab.operateFlexTab('members', false);
				});

				test('expect show the members tab button', () => {
					flexTab.membersTab.should('be.visible');
				});

				test('expect show the members content', () => {
					flexTab.membersTabContent.should('be.visible');
				});
			});

			describe('Notifications Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('notifications', true);
				});

				after(() => {
					flexTab.operateFlexTab('notifications', false);
				});

				test('expect not show the notifications button', () => {
					flexTab.notificationsTab.should('not.exist');
				});

				test('expect show the notifications Tab content', () => {
					flexTab.notificationsSettings.should('be.visible');
				});
			});

			describe('Files Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('files', true);
				});

				after(() => {
					flexTab.operateFlexTab('files', false);
				});

				test('expect show the files Tab content', () => {
					flexTab.filesTabContent.should('be.visible');
				});
			});

			describe('Mentions Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('mentions', true);
				});

				after(() => {
					flexTab.operateFlexTab('mentions', false);
				});

				test('expect show the mentions Tab content', () => {
					flexTab.mentionsTabContent.should('be.visible');
				});
			});

			describe('Starred Messages Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('starred', true);
				});

				after(() => {
					flexTab.operateFlexTab('starred', false);
				});

				test('expect show the starred messages Tab content', () => {
					flexTab.starredTabContent.should('be.visible');
				});
			});

			describe('Pinned Messages Tab:', () => {
				before(() => {
					flexTab.operateFlexTab('pinned', true);
				});

				after(() => {
					flexTab.operateFlexTab('pinned', false);
				});

				test('expect show the pinned messages Tab content', () => {
					flexTab.pinnedTabContent.should('be.visible');
				});
			});
		});
	});
});
