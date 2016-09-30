/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//Login info from the test user
const username = 'user-test-'+Date.now();
const email = username+'@rocket.chat';
const password = 'rocket.chat';

//Names of the test channels
const PublicChannelName = 'channel-test-'+Date.now();
const privateChannelName = 'private-channel-test-'+Date.now();

//User interactions(direct messages, add, remove...)
const targetUser = 'rocket.cat';

//Test data
const message = 'message from '+username;



//Basic usage test start
describe('Basic usage', function() {
	it('load page', () => {
		loginPage.open();
		// browser.windowHandleSize({width:1280, height:800});
	});

	it('crate user', function() {
		loginPage.gotToRegister();

		loginPage.registerNewUser({username, email, password});

		browser.waitForExist('form#login-card input#username', 5000);

		browser.click('.submit > button');

		browser.waitForExist('.main-content', 5000);


	});

	it('logout', function() {
		browser.waitForVisible('.account-box');
		browser.click('.account-box');
		browser.pause(200);

		browser.waitForVisible('#logout');
		browser.click('#logout');


	});

	it('login', function() {
		loginPage.login({email, password});
		browser.waitForExist('.main-content', 5000);


	});

	describe('side nav bar', function() {
		describe('render', function() {
			it('should show the logged username', () => {
				sideNav.accountBoxUserName.isVisible().should.be.true;
			});
			it('should show the logged user avatar', function() {
				sideNav.accountBoxUserAvatar.isVisible().should.be.true;
			});
			it('should show the new channel button', function() {
				sideNav.newChannelBtn.isVisible().should.be.true;
			});
			it('should show the plus icon', function() {
				sideNav.newChannelIcon.isVisible().should.be.true;
			});
			it('should show the "More Channels" button', function() {
				sideNav.moreChannels.isVisible().should.be.true;
			});
			it('should show the new direct message button', function() {
				sideNav.newDirectMessageBtn.isVisible().should.be.true;
			});
			it('should show the plus icon', function() {
				sideNav.newDirectMessageIcon.isVisible().should.be.true;
			});
			it('should show the "More Direct Messages" buton', function() {
				sideNav.moreDirectMessages.isVisible().should.be.true;
			});
			it('should show "general" channel', function() {
				sideNav.general.isVisible().should.be.true;
			});
			it('should not show eye icon on general', function() {
				sideNav.channelHoverIcon.isVisible().should.be.false;
			});
			it('should show eye icon on hover', function() {
				sideNav.general.moveToObject();
				sideNav.channelHoverIcon.isVisible().should.be.true;
			});
		});

		describe('user options', function() {
			describe('render', function() {


				it('should show user options', function() {
					sideNav.accountBoxUserName.click();
					sideNav.userOptions.waitForVisible();
					sideNav.userOptions.isVisible().should.be.true;
				});
				it('should show online button', function() {
					sideNav.statusOnline.isVisible().should.be.true;
				});
				it('should show away button', function() {
					sideNav.statusAway.isVisible().should.be.true;
				});
				it('should show busy button', function() {
					sideNav.statusBusy.isVisible().should.be.true;
				});
				it('should show offline button', function() {
					sideNav.statusOffline.isVisible().should.be.true;
				});
				it('should show settings button', function() {
					sideNav.account.isVisible().should.be.true;
				});
				it('should show logout button', function() {
					sideNav.logout.isVisible().should.be.true;
				});


			});
		});
	});

	it('open GENERAL', function() {
		browser.waitForExist('.wrapper > ul .link-room-GENERAL', 50000);
		browser.click('.wrapper > ul .link-room-GENERAL');

		browser.waitForExist('.input-message', 5000);


	});

	describe('flextab usage', function() {
		describe('render', function() {
			it('should show the room info button', function() {
				flexTab.channelTab.isVisible().should.be.true;
			});
			it('should show the room info tab content', function() {
				flexTab.channelTab.click();
				flexTab.channelSettings.isVisible().should.be.true;
			});

			it('should show the message search  button', function() {
				flexTab.searchTab.isVisible().should.be.true;
			});
			it('should show the message tab content', function() {
				flexTab.searchTab.click();
				flexTab.searchTabContent.isVisible().should.be.true;
			});


			it('should show the members tab button', function() {
				flexTab.membersTab.isVisible().should.be.true;
			});
			it('should show the members content', function() {
				flexTab.membersTab.click();
				flexTab.membersTabContent.isVisible().should.be.true;
			});
			it('should show the members search bar', function() {
				flexTab.userSearchBar.isVisible().should.be.true;
			});
			it('should show the show all link', function() {
				flexTab.showAll.isVisible().should.be.true;
			});
			it('should show the start video call button', function() {
				flexTab.startVideoCall.isVisible().should.be.true;
			});
			it('should show the start audio call', function() {
				flexTab.startAudioCall.isVisible().should.be.true;
			});


			it('should show the notifications button', function() {
				flexTab.notificationsTab.isVisible().should.be.true;
			});
			it('should show the notifications Tab content', function() {
				flexTab.notificationsTab.click();
				flexTab.notificationsSettings.isVisible().should.be.true;
			});

			it('should show the files button', function() {
				flexTab.filesTab.isVisible().should.be.true;
			});
			it('should show the files Tab content', function() {

				flexTab.filesTab.click();
				flexTab.filesTabContent.isVisible().should.be.true;
			});

			it('should show the mentions button', function() {
				flexTab.mentionsTab.isVisible().should.be.true;
			});
			it('should show the mentions Tab content', function() {
				flexTab.mentionsTab.click();
				flexTab.mentionsTabContent.isVisible().should.be.true;
			});

			it('should show the starred button', function() {
				flexTab.starredTab.isVisible().should.be.true;
			});
			it('should show the starred Tab content', function() {
				flexTab.starredTab.click();
				flexTab.starredTabContent.isVisible().should.be.true;
			});

			it('should show the pinned button', function() {
				flexTab.pinnedTab.isVisible().should.be.true;
			});
			it('should show the pinned messages Tab content', function() {
				flexTab.pinnedTab.click();
				flexTab.pinnedTabContent.isVisible().should.be.true;
			});

		});
	});

	it('send a message', function() {
		mainContent.sendMessage(message);

	});

	//DIRECT MESAGE

	it('start a direct message with rocket.cat', function() {
		sideNav.startDirectMessage(targetUser);

	});

	it('open the direct message', function() {
		sideNav.openChannel(targetUser);

	});

	it('send a direct message', function() {
		mainContent.sendMessage(message);

	});

	//CHANNEL

	it('create a public channel', function() {
		sideNav.createChannel(PublicChannelName, false, false);
		sideNav.openChannel(PublicChannelName);

	});

	it('send a message in the public channel', function() {
		mainContent.sendMessage(message);

	});

	it('add people to the room', function() {
		flexTab.addPeopleToChannel(targetUser);

	});

	it('remove people from room', function() {
		flexTab.closeTabs();
		flexTab.removePeopleFromChannel(targetUser);
		flexTab.confirmPopup();

	});

	it('archive the room', function() {
		flexTab.archiveChannel();
		flexTab.closeTabs();

	});

	it('open GENERAL', function() {
		sideNav.openChannel('general');

	});

	//Private Channel

	it('create a private channel', function() {
		sideNav.createChannel(privateChannelName, true, false);

	});

	it('send a message in the private channel', function() {
		mainContent.sendMessage(message);

	});

	it('add people to the room', function() {
		flexTab.addPeopleToChannel(targetUser);

	});

	it('remove people from room', function() {
		flexTab.closeTabs();
		flexTab.removePeopleFromChannel(targetUser);
		flexTab.confirmPopup();

	});

	it('archive the room', function() {
		flexTab.archiveChannel();
		flexTab.closeTabs();

	});
});



/*	get membersTab() { return browser.element('[title=Members]'); }
	get userSearchBar() { return browser.element('.animated'); }
	get userSearchBar() { return browser.element('#user-add-search'); }
	get removeUserBtn() { return browser.element('.remove-user'); }
	get startVideoCall() { return browser.element('start-video-call'); }
	get startAudioCall() { return browser.element('start-audio-call'); }
	get showAll() { return browser.element('.see-all'); }


	get channelTab() { return browser.element('[title="Room Info"]'); }
	get channelSettings() { return browser.element('.channel-settings'); }

	get searchTab() { return browser.element('[title="Search"]'); }
	get searchTabContent() { return browser.element('.search-messages-list'); }
	get messageSearchBar() { return browser.element('#message-search'); }
	get searchResult() { return browser.element('.new-day'); }

	get notificationsTab() { return browser.element('[title="Notifications"]'); }
	get notificationsSettings() { return browser.element('.push-notifications'); }

	get filesTab() { return browser.element('[title="Files List"]'); }
	get fileItem() { return browser.element('.uploaded-files ul:first-child'); }
	get filesTabContent() { return browser.element('.uploaded-files'); }
	get fileDelete() { return browser.element('.uploaded-files ul:first-child .file-delete'); }
	get fileDownload() { return browser.element('.uploaded-files ul:first-child .file-download'); }
	get fileName() { return browser.element('.uploaded-files ul:first-child .room-file-item'); }

	get mentionsTab() { return browser.element('[title="Mentions"]'); }
	get mentionsTabContent() { return browser.element('.mentioned-messages-list'); }



	get starredTab() { return browser.element('[title="Starred Messages"]'); }
	get starredTabContent() { return browser.element('.starred-messages-list'); }


	get pinnedTab() { return browser.element('[title="Pinned Messages"]'); }
	get pinnedTabContent() { return browser.element('pinned-messages-list'); }



	get archiveBtn() { return browser.element('.clearfix:last-child .icon-pencil'); }
	get archiveRadio() { return browser.element('.editing'); }
	get archiveSave() { return browser.element('.save'); }

	get confirmBtn() { return browser.element('.confirm'); }
	*/