/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

//test data imports
import {checkIfUserIsValid} from '../../data/checks';
import {username, email, password} from '../../data/user.js';

describe('[Main Elements Render]', function() {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});

	describe('[Side Nav Bar]', () => {
		describe('render:', () => {
			it('it should show the logged username', () => {
				sideNav.accountBoxUserName.isVisible().should.be.true;
			});

			it('it should show the logged user avatar', () => {
				sideNav.accountBoxUserAvatar.isVisible().should.be.true;
			});

			it('it should show the new channel button', () => {
				sideNav.newChannelBtn.waitForVisible(20000);
				sideNav.newChannelBtn.isVisible().should.be.true;
			});

			it('it should show the plus icon', () => {
				sideNav.newChannelIcon.isVisible().should.be.true;
			});

			it('it should show "general" channel', () => {
				sideNav.general.isVisible().should.be.true;
			});

			it('it should show spotlight search bar', () => {
				sideNav.spotlightSearch.isVisible().should.be.true;
			});
		});

		describe('spotlight search render:', () => {
			it('it should show spotlight search bar', () => {
				sideNav.spotlightSearch.isVisible().should.be.true;
			});

			it('it should click the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.waitForVisible(5000);
				sideNav.spotlightSearch.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
			});

			it.skip('it should remove the list when the spotlight loses focus', () => {
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
				mainContent.messageInput.click();
				mainContent.lastMessage.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000, true);
				sideNav.spotlightSearchPopUp.isVisible().should.be.false;
			});

			it('it should add text to the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.waitForVisible(5000);
				sideNav.spotlightSearch.setValue('rocket.cat');
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
			});

			it.skip('it should remove the text on the spotlight and the list when lost focus', () => {
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
				mainContent.messageInput.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000, true);
				sideNav.spotlightSearchPopUp.isVisible().should.be.false;
				sideNav.spotlightSearch.getText().should.equal('');
			});
		});
	});

	describe('[User Options]', () => {
		describe('render:', () => {
			before(() => {
				sideNav.accountMenu.click();
				sideNav.getPopOverContent().waitForVisible(10000);
			});

			after(() => {
				mainContent.popoverWrapper.click();
			});

			it('it should show online button', () => {
				sideNav.statusOnline.isVisible().should.be.true;
			});

			it('it should show away button', () => {
				sideNav.statusAway.isVisible().should.be.true;
			});

			it('it should show busy button', () => {
				sideNav.statusBusy.isVisible().should.be.true;
			});

			it('it should show offline button', () => {
				sideNav.statusOffline.isVisible().should.be.true;
			});

			it('it should show settings button', () => {
				sideNav.account.isVisible().should.be.true;
			});

			it('it should show logout button', () => {
				sideNav.logout.isVisible().should.be.true;
			});
		});
	});

	describe('[Main Content]', () => {
		describe('render:', () => {
			before(()=> {
				sideNav.logout.waitForVisible(5000, true);
				sideNav.getChannelFromList('general').waitForVisible(5000);
				sideNav.openChannel('general');
			});

			it('it should show the title of the channel', () => {
				mainContent.channelTitle.isVisible().should.be.true;
			});

			it('it should show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.isVisible().should.be.true;
			});

			it('it should click the star', () => {
				mainContent.emptyFavoriteStar.click();
			});

			it('it should not show the empty favorite star', () => {
				mainContent.favoriteStar.isVisible().should.be.true;
			});

			it('it should click the star', () => {
				mainContent.favoriteStar.click();
			});

			it('it should show the message input bar', () => {
				mainContent.messageInput.isVisible().should.be.true;
			});

			it('it should show the message box actions button', () => {
				mainContent.messageBoxActions.isVisible().should.be.true;
			});

			//issues with the new message box action button and the no animations on tests

			it.skip('it should show the audio recording button', () => {
				mainContent.recordBtn.isVisible().should.be.true;
			});

			it.skip('it should show the video call button', () => {
				mainContent.videoCamBtn.isVisible().should.be.true;
			});

			it('it should show the emoji button', () => {
				mainContent.emojiBtn.isVisible().should.be.true;
			});

			it('it should show the last message', () => {
				mainContent.lastMessage.isVisible().should.be.true;
			});

			it('it should be that the last message is from the loged user', () => {
				mainContent.lastMessageUser.getText().should.equal(username);
			});

			it('it should not show the Admin tag', () => {
				mainContent.lastMessageUserTag.isVisible().should.be.false;
			});
		});
	});

	describe('[Flextab]', () => {
		describe('[Render]', () => {
			before(()=> {
				sideNav.getChannelFromList('general').waitForVisible(5000);
				sideNav.openChannel('general');
			});

			after(()=> {
				flexTab.operateFlexTab('info', false);
			});
			describe('Room Info Tab:', () => {
				before(()=> {
					flexTab.operateFlexTab('info', true);
				});

				after(()=> {
					flexTab.operateFlexTab('info', false);
				});

				it('it should show the room info button', () => {
					flexTab.channelTab.isVisible().should.be.true;
				});

				it('it should show the room info tab content', () => {
					flexTab.channelSettings.waitForVisible(5000);
					flexTab.channelSettings.isVisible().should.be.true;
				});

				it('it should show the room name', ()=> {
					flexTab.channelSettingName.waitForVisible();
					flexTab.channelSettingName.getAttribute('title').should.equal('general');
				});

			});

			describe('Search Tab:', () => {
				before(()=> {
					flexTab.operateFlexTab('search', true);
				});

				after(()=> {
					flexTab.operateFlexTab('search', false);
				});

				it('it should show the message search  button', () => {
					flexTab.searchTab.isVisible().should.be.true;
				});

				it('it should show the message tab content', () => {
					flexTab.searchTabContent.isVisible().should.be.true;
				});
			});

			describe.skip('Members Tab:', () => {
				before(()=> {
					flexTab.operateFlexTab('members', true);
				});

				after(()=> {
					flexTab.operateFlexTab('members', false);
				});

				it('it should show the members tab button', () => {
					flexTab.membersTab.waitForVisible(5000);
					flexTab.membersTab.isVisible().should.be.true;
				});

				it('it should show the members content', () => {
					flexTab.membersTabContent.waitForVisible(5000);
					flexTab.membersTabContent.isVisible().should.be.true;
				});

				it('it should show the show all link', () => {
					flexTab.showAll.isVisible().should.be.true;
				});
			});

			describe('Notifications Tab:', () => {
				before(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('notifications', true);
				});

				after(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('notifications', false);
				});

				it('it should not show the notifications button', () => {
					flexTab.notificationsTab.isVisible().should.be.false;
				});

				it('it should show the notifications Tab content', () => {
					flexTab.notificationsSettings.isVisible().should.be.true;
				});
			});

			describe('Files Tab:', () => {
				before(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('files', true);
				});

				after(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('files', false);
				});

				it('it should show the files Tab content', () => {
					flexTab.filesTabContent.isVisible().should.be.true;
				});
			});

			describe('Mentions Tab:', () => {
				before(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('mentions', true);
				});

				after(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('mentions', false);
				});

				it('it should show the mentions Tab content', () => {
					flexTab.mentionsTabContent.isVisible().should.be.true;
				});
			});

			describe('Starred Messages Tab:', () => {
				before(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('starred', true);
				});

				after(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('starred', false);
				});

				it('it should show the starred messages Tab content', () => {
					flexTab.starredTabContent.isVisible().should.be.true;
				});
			});

			describe('Pinned Messages Tab:', () => {
				before(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('pinned', true);
				});

				after(()=> {
					flexTab.moreActions.click();
					flexTab.operateFlexTab('pinned', false);
				});

				it('it should show the pinned messages Tab content', () => {
					flexTab.pinnedTabContent.isVisible().should.be.true;
				});
			});
		});
	});
});
