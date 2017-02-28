/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

//test data imports
import {checkIfUserIsValid} from '../../data/checks';
import {username, email, password} from '../../data/user.js';

describe('Main Elements Render', function() {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});

	describe('side nav bar', () => {
		describe('render', () => {
			it('should show the logged username', () => {
				sideNav.accountBoxUserName.isVisible().should.be.true;
			});

			it('should show the logged user avatar', () => {
				sideNav.accountBoxUserAvatar.isVisible().should.be.true;
			});

			it('should show the new channel button', () => {
				sideNav.newChannelBtn.isVisible().should.be.true;
			});

			it('should show the plus icon', () => {
				sideNav.newChannelIcon.isVisible().should.be.true;
			});

			it('should show the "More Channels" button', () => {
				sideNav.moreChannels.isVisible().should.be.true;
			});

			it('should show the new direct message button', () => {
				sideNav.newDirectMessageBtn.isVisible().should.be.true;
			});

			it('should show "general" channel', () => {
				sideNav.general.isVisible().should.be.true;
			});

			it('should show spotlight search bar', () => {
				sideNav.spotlightSearch.isVisible().should.be.true;
			});
		});

		describe('spotlight search render', () => {
			it('should show spotlight search bar', () => {
				sideNav.spotlightSearch.isVisible().should.be.true;
			});

			it('should click the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.waitForVisible(5000);
				sideNav.spotlightSearch.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
			});

			it('when the spotlight loses focus the list should disappear', () => {
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
				mainContent.messageInput.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000, true);
				sideNav.spotlightSearchPopUp.isVisible().should.be.false;
			});

			it('should add text to the spotlight and show the channel list', () => {
				sideNav.spotlightSearch.waitForVisible(5000);
				sideNav.spotlightSearch.setValue('rocket.cat');
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
			});

			it('the text on the spotlight and the list should disappear when lost focus', () => {
				sideNav.spotlightSearchPopUp.waitForVisible(5000);
				sideNav.spotlightSearchPopUp.isVisible().should.be.true;
				mainContent.messageInput.click();
				sideNav.spotlightSearchPopUp.waitForVisible(5000, true);
				sideNav.spotlightSearchPopUp.isVisible().should.be.false;
				sideNav.spotlightSearch.getText().should.equal('');
			});
		});
	});

	describe('user options', () => {
		describe('render', () => {
			before(() => {
				sideNav.accountBoxUserName.click();
				sideNav.userOptions.waitForVisible(5000);
			});

			after(() => {
				sideNav.accountBoxUserName.click();
			});

			it('should show user options', () => {
				sideNav.userOptions.isVisible().should.be.true;
			});

			it('should show online button', () => {
				sideNav.statusOnline.isVisible().should.be.true;
			});

			it('should show away button', () => {
				sideNav.statusAway.isVisible().should.be.true;
			});

			it('should show busy button', () => {
				sideNav.statusBusy.isVisible().should.be.true;
			});

			it('should show offline button', () => {
				sideNav.statusOffline.isVisible().should.be.true;
			});

			it('should show settings button', () => {
				sideNav.account.isVisible().should.be.true;
			});

			it('should show logout button', () => {
				sideNav.logout.isVisible().should.be.true;
			});
		});
	});

	describe('main content', () => {
		describe('render', () => {
			before(()=> {
				sideNav.logout.waitForVisible(5000, true);
				sideNav.getChannelFromList('general').waitForVisible(5000);
				sideNav.openChannel('general');
			});

			it('should show the title of the channel', () => {
				mainContent.channelTitle.isVisible().should.be.true;
			});

			it('should show the empty favorite star', () => {
				mainContent.emptyFavoriteStar.isVisible().should.be.true;
			});

			it('clicks the star', () => {
				mainContent.emptyFavoriteStar.click();
			});

			it('should not show the empty favorite star', () => {
				mainContent.favoriteStar.isVisible().should.be.true;
			});

			it('clicks the star', () => {
				mainContent.favoriteStar.click();
			});

			it('should show the message input bar', () => {
				mainContent.messageInput.isVisible().should.be.true;
			});

			it('should show the file attachment button', () => {
				mainContent.fileAttachmentBtn.isVisible().should.be.true;
			});

			it('should show the audio recording button', () => {
				mainContent.recordBtn.isVisible().should.be.true;
			});

			it('should show the video call button', () => {
				mainContent.videoCamBtn.isVisible().should.be.true;
			});

			it('should not show the send button', () => {
				mainContent.sendBtn.isVisible().should.be.false;
			});

			it('should show the emoji button', () => {
				mainContent.emojiBtn.isVisible().should.be.true;
			});

			it('adds some text to the input', () => {
				mainContent.addTextToInput('Some Text');
			});

			it('should show the send button', () => {
				mainContent.sendBtn.isVisible().should.be.true;
			});

			it('should not show the file attachment button', () => {
				mainContent.fileAttachmentBtn.isVisible().should.be.false;
			});

			it('should not show the audio recording button', () => {
				mainContent.recordBtn.isVisible().should.be.false;
			});

			it('should not show the video call button', () => {
				mainContent.videoCamBtn.isVisible().should.be.false;
			});

			it('should show the last message', () => {
				mainContent.lastMessage.isVisible().should.be.true;
			});

			it('the last message should be from the loged user', () => {
				mainContent.lastMessageUser.getText().should.equal(username);
			});

			it('should not show the Admin tag', () => {
				mainContent.lastMessageUserTag.isVisible().should.be.false;
			});
		});
	});

	describe('flextab usage', () => {
		describe('render', () => {
			before(()=> {
				sideNav.getChannelFromList('general').waitForVisible(5000);
				sideNav.openChannel('general');
			});
			describe('Room Info Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('info', true);
				});

				after(()=> {
					flexTab.operateFlexTab('info', false);
				});

				it('should show the room info button', () => {
					flexTab.channelTab.isVisible().should.be.true;
				});

				it('should show the room info tab content', () => {
					flexTab.channelSettings.waitForVisible(5000);
					flexTab.channelSettings.isVisible().should.be.true;
				});

				it('should show the room name', ()=> {
					flexTab.firstSetting.waitForVisible();
					flexTab.firstSetting.getText().should.equal('general');
				});

			});

			describe('Search Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('search', true);
				});

				after(()=> {
					flexTab.operateFlexTab('search', false);
				});

				it('should show the message search  button', () => {
					flexTab.searchTab.isVisible().should.be.true;
				});

				it('should show the message tab content', () => {
					flexTab.searchTabContent.isVisible().should.be.true;
				});
			});

			describe('Members Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('members', true);
				});

				after(()=> {
					flexTab.operateFlexTab('members', false);
				});

				it('should show the members tab button', () => {
					flexTab.membersTab.waitForVisible(5000);
					flexTab.membersTab.isVisible().should.be.true;
				});

				it('should show the members content', () => {
					flexTab.membersTabContent.waitForVisible(5000);
					flexTab.membersTabContent.isVisible().should.be.true;
				});

				it('should show the show all link', () => {
					flexTab.showAll.isVisible().should.be.true;
				});
			});

			describe('Notifications Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('notifications', true);
				});

				after(()=> {
					flexTab.operateFlexTab('notifications', false);
				});

				it('should show the notifications button', () => {
					flexTab.notificationsTab.isVisible().should.be.true;
				});

				it('should show the notifications Tab content', () => {
					flexTab.notificationsSettings.isVisible().should.be.true;
				});
			});

			describe('Files Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('files', true);
				});

				after(()=> {
					flexTab.operateFlexTab('files', false);
				});

				it('should show the files button', () => {
					flexTab.filesTab.isVisible().should.be.true;
				});

				it('should show the files Tab content', () => {
					flexTab.filesTabContent.isVisible().should.be.true;
				});
			});

			describe('Mentions Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('mentions', true);
				});

				after(()=> {
					flexTab.operateFlexTab('mentions', false);
				});

				it('should show the mentions button', () => {
					flexTab.mentionsTab.isVisible().should.be.true;
				});

				it('should show the mentions Tab content', () => {
					flexTab.mentionsTabContent.isVisible().should.be.true;
				});
			});

			describe('Starred Messages Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('starred', true);
				});

				after(()=> {
					flexTab.operateFlexTab('starred', false);
				});

				it('should show the starred messages button', () => {
					flexTab.starredTab.isVisible().should.be.true;
				});

				it('should show the starred messages Tab content', () => {
					flexTab.starredTabContent.isVisible().should.be.true;
				});
			});

			describe('Pinned Messages Tab', () => {
				before(()=> {
					flexTab.operateFlexTab('pinned', true);
				});

				after(()=> {
					flexTab.operateFlexTab('pinned', false);
				});

				it('should show the pinned button', () => {
					flexTab.pinnedTab.isVisible().should.be.true;
				});

				it('should show the pinned messages Tab content', () => {
					flexTab.pinnedTabContent.isVisible().should.be.true;
				});
			});
		});
	});
});
