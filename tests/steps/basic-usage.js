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
	this.retries(2);

	it('load page', () => {
		loginPage.open();
	});

	it('create user', () => {
		loginPage.gotToRegister();

		loginPage.registerNewUser({username, email, password});

		browser.waitForExist('form#login-card input#username', 5000);

		browser.click('.submit > button');

		browser.waitForExist('.main-content', 5000);
	});

	it('logout', () => {
		browser.waitForVisible('.account-box');
		browser.click('.account-box');
		browser.pause(200);

		browser.waitForVisible('#logout');
		browser.click('#logout');
	});

	it('login', () => {
		loginPage.login({email, password});
		browser.waitForExist('.main-content', 5000);
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

			it('should show the plus icon', () => {
				sideNav.newDirectMessageIcon.isVisible().should.be.true;
			});

			it('should show the "More Direct Messages" buton', () => {
				sideNav.moreDirectMessages.isVisible().should.be.true;
			});

			it('should show "general" channel', () => {
				sideNav.general.isVisible().should.be.true;
			});

			it('should not show eye icon on general', () => {
				sideNav.channelHoverIcon.isVisible().should.be.false;
			});

			it.skip('should show eye icon on hover', () => {
				sideNav.general.moveToObject();
				sideNav.channelHoverIcon.isVisible().should.be.true;
			});
		});

		describe('user options', () => {
			describe('render', () => {
				before(() => {
					sideNav.accountBoxUserName.click();
				});

				after(() => {
					sideNav.accountBoxUserName.click();
				});

				it('should show user options', () => {
					sideNav.userOptions.waitForVisible();
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
	});

	describe('general channel', () => {
		it('open GENERAL', () => {
			browser.waitForExist('.wrapper > ul .link-room-GENERAL', 50000);
			browser.click('.wrapper > ul .link-room-GENERAL');

			browser.waitForExist('.input-message', 5000);
		});

		it('send a message', () => {
			mainContent.sendMessage(message);
		});

		describe('main content usage', () => {
			describe('render', () => {
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
			});

			describe('fileUpload', ()=> {
				it('send a attachment', () => {
					mainContent.fileUpload('/home/martin/Downloads/cat.jpg');
				});

				it('should show the confirm button', () => {
					mainContent.popupFileConfirmBtn.isVisible().should.be.true;
				});

				it('should show the cancel buttno', () => {
					mainContent.popupFileCancelBtn.isVisible().should.be.true;
				});

				it('should show the file preview', () => {
					mainContent.popupFilePreview.isVisible().should.be.true;
				});

				it('should show the confirm buttno', () => {
					mainContent.popupFileConfirmBtn.isVisible().should.be.true;
				});

				it('should show the file title', () => {
					mainContent.popupFileTitle.isVisible().should.be.true;
				});

				it('click the confirm', () => {
					mainContent.popupFileConfirmBtn.click();
				});

				it('should show the image message', () => {
					mainContent.lastMessageImg.isVisible();
				});
			});
		});
	});

	describe('flextab usage', () => {
		describe('render', () => {
			it('should show the room info button', () => {
				flexTab.channelTab.isVisible().should.be.true;
			});

			it('should show the room info tab content', () => {
				flexTab.channelTab.click();
				flexTab.channelSettings.isVisible().should.be.true;
			});

			it('should show the message search  button', () => {
				flexTab.searchTab.isVisible().should.be.true;
			});

			it('should show the message tab content', () => {
				flexTab.searchTab.click();
				flexTab.searchTabContent.isVisible().should.be.true;
			});

			it('should show the members tab button', () => {
				flexTab.membersTab.isVisible().should.be.true;
			});

			it('should show the members content', () => {
				flexTab.membersTab.click();
				flexTab.membersTabContent.isVisible().should.be.true;
			});

			it.skip('should show the members search bar', () => {
				flexTab.userSearchBar.isVisible().should.be.true;
			});

			it('should show the show all link', () => {
				flexTab.showAll.isVisible().should.be.true;
			});

			it.skip('should show the start video call button', () => {
				flexTab.startVideoCall.isVisible().should.be.true;
			});

			it.skip('should show the start audio call', () => {
				flexTab.startAudioCall.isVisible().should.be.true;
			});

			it('should show the notifications button', () => {
				flexTab.notificationsTab.isVisible().should.be.true;
			});

			it('should show the notifications Tab content', () => {
				flexTab.notificationsTab.click();
				flexTab.notificationsSettings.isVisible().should.be.true;
			});

			it('should show the files button', () => {
				flexTab.filesTab.isVisible().should.be.true;
			});

			it('should show the files Tab content', () => {
				flexTab.filesTab.click();
				flexTab.filesTabContent.isVisible().should.be.true;
			});

			it('should show the mentions button', () => {
				flexTab.mentionsTab.isVisible().should.be.true;
			});

			it('should show the mentions Tab content', () => {
				flexTab.mentionsTab.click();
				flexTab.mentionsTabContent.isVisible().should.be.true;
			});

			it('should show the starred button', () => {
				flexTab.starredTab.isVisible().should.be.true;
			});

			it('should show the starred Tab content', () => {
				flexTab.starredTab.click();
				flexTab.starredTabContent.isVisible().should.be.true;
			});

			it('should show the pinned button', () => {
				flexTab.pinnedTab.isVisible().should.be.true;
			});

			it('should show the pinned messages Tab content', () => {
				flexTab.pinnedTab.click();
				flexTab.pinnedTabContent.isVisible().should.be.true;
			});
		});
	});

	describe('direct channel', () => {
		it('start a direct message with rocket.cat', () => {
			sideNav.startDirectMessage(targetUser);
		});

		it('open the direct message', () => {
			sideNav.openChannel(targetUser);
		});

		it('send a direct message', () => {
			mainContent.sendMessage(message);
		});
	});

	describe('public channel', () => {
		it('create a public channel', () => {
			sideNav.createChannel(PublicChannelName, false, false);
			sideNav.openChannel(PublicChannelName);
		});

		it('send a message in the public channel', () => {
			mainContent.sendMessage(message);
		});

		it('add people to the room', () => {
			flexTab.membersTab.click();
			flexTab.addPeopleToChannel(targetUser);
		});

		it('remove people from room', () => {
			flexTab.removePeopleFromChannel(targetUser);
			flexTab.confirmPopup();
		});

		it('archive the room', () => {
			flexTab.channelTab.click();
			flexTab.archiveChannel();
			flexTab.channelTab.click();
		});

		it('open GENERAL', () => {
			sideNav.openChannel('general');
		});
	});

	describe('privte channel', () => {
		it('create a private channel', () => {
			sideNav.createChannel(privateChannelName, true, false);
		});

		it('send a message in the private channel', () => {
			mainContent.sendMessage(message);
		});

		it('add people to the room', () => {
			flexTab.membersTab.click();
			flexTab.addPeopleToChannel(targetUser);
		});

		it('remove people from room', () => {
			flexTab.removePeopleFromChannel(targetUser);
			flexTab.confirmPopup();
		});

		it('archive the room', () => {
			flexTab.channelTab.click();
			flexTab.archiveChannel();
			flexTab.channelTab.click();
		});
	});
});