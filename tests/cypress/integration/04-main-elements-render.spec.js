import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import { checkIfUserIsValid } from '../../data/checks';
import { username, email, password } from '../../data/user.js';

describe('[Main Elements Render]', function () {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.click();
		sideNav.searchChannel('general');
	});

	describe('[Side Nav Bar]', () => {
		describe('render:', () => {
			it('it should show the new channel button', () => {
				sideNav.newChannelBtnToolbar.should('be.visible');
			});

			it('it should show "general" channel', () => {
				sideNav.general.should('be.visible');
			});
		});

		describe('spotlight search render:', () => {
			after(() => {
				mainContent.messageInput.click();
			});
			it('it should show spotlight search bar', () => {
				sideNav.spotlightSearchIcon.click();
				sideNav.spotlightSearch.should('be.visible');
			});

			it('it should click the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.click('center');
				sideNav.spotlightSearchPopUp.should('be.visible');
			});

			it.skip('it should remove the list when the spotlight loses focus', () => {
				sideNav.spotlightSearchPopUp.should('be.visible');
				mainContent.messageInput.click();
				mainContent.lastMessage.click();
				sideNav.spotlightSearchPopUp.should('not.exist');
			});

			it('it should add text to the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.type('rocket.cat');
				sideNav.spotlightSearchPopUp.should('be.visible');
			});

			it.skip('it should remove the text on the spotlight and the list when lost focus', () => {
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

			it('it should show online button', () => {
				sideNav.statusOnline.should('be.visible');
			});

			it('it should show away button', () => {
				sideNav.statusAway.should('be.visible');
			});

			it('it should show busy button', () => {
				sideNav.statusBusy.should('be.visible');
			});

			it('it should show offline button', () => {
				sideNav.statusOffline.should('be.visible');
			});

			it('it should show my account button', () => {
				sideNav.account.should('be.visible');
			});

			it('it should show logout button', () => {
				sideNav.logout.should('be.visible');
			});
		});
	});

	describe('[Main Content]', () => {
		describe('render:', () => {
			before(() => {
				sideNav.openChannel('general');
			});

			it('it should show the title of the channel', () => {
				mainContent.channelTitle.contains('general').should('be.visible');
			});

			it('it should show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.should('be.visible');
			});

			it('it should click the star', () => {
				mainContent.emptyFavoriteStar.click();
			});

			it('it should show the filled favorite star', () => {
				mainContent.favoriteStar.should('be.visible');
			});

			it('it should click the star', () => {
				mainContent.favoriteStar.click();
			});

			it('it should show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.should('be.visible');
			});

			it('it should show the message input bar', () => {
				mainContent.messageInput.should('be.visible');
			});

			it('it should show the message box actions button', () => {
				mainContent.messageBoxActions.should('be.visible');
			});

			// issues with the new message box action button and the no animations on tests

			it('it should show the audio recording button', () => {
				mainContent.recordBtn.should('be.visible');
			});

			it('it should show the emoji button', () => {
				mainContent.emojiBtn.should('be.visible');
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

				it('it should show the room info button', () => {
					flexTab.channelTab.should('be.visible');
				});

				it('it should show the room info tab content', () => {
					flexTab.channelSettings.should('be.visible');
				});

				it.skip('it should show the room name', () => {
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

				it('it should show the message search  button', () => {
					flexTab.searchTab.should('be.visible');
				});

				it('it should show the message tab content', () => {
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

				it('it should show the members tab button', () => {
					flexTab.membersTab.should('be.visible');
				});

				it('it should show the members content', () => {
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

				it('it should not show the notifications button', () => {
					flexTab.notificationsTab.should('not.exist');
				});

				it('it should show the notifications Tab content', () => {
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

				it('it should show the files Tab content', () => {
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

				it('it should show the mentions Tab content', () => {
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

				it('it should show the starred messages Tab content', () => {
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

				it('it should show the pinned messages Tab content', () => {
					flexTab.pinnedTabContent.should('be.visible');
				});
			});
		});
	});
});
