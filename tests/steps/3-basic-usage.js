/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//test data imports
import {username, email, password} from '../test-data/user.js';
import {publicChannelName, privateChannelName} from '../test-data/channel.js';
import {targetUser} from '../test-data/interactions.js';

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

			it('should show the "More Direct Messages" button', () => {
				sideNav.moreDirectMessages.isVisible().should.be.true;
			});

			it('should show "general" channel', () => {
				sideNav.general.isVisible().should.be.true;
			});

			it('should not show eye icon on general', () => {
				sideNav.channelHoverIcon.isVisible().should.be.false;
			});

			it('should show eye icon on hover', () => {
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

			describe('fileUpload', ()=> {
				it('send a attachment', () => {
					mainContent.fileUpload('./public/images/logo/1024x1024.png');
				});

				it('should show the confirm button', () => {
					mainContent.popupFileConfirmBtn.isVisible().should.be.true;
				});

				it('should show the cancel button', () => {
					mainContent.popupFileCancelBtn.isVisible().should.be.true;
				});

				it('should show the file preview', () => {
					mainContent.popupFilePreview.isVisible().should.be.true;
				});

				it('should show the confirm button', () => {
					mainContent.popupFileConfirmBtn.isVisible().should.be.true;
				});

				it('should show the file title', () => {
					mainContent.popupFileTitle.isVisible().should.be.true;
				});

				it('click the confirm', () => {
					mainContent.popupFileConfirmBtn.click();
				});
			});

			describe('messages actions in general room', ()=> {
				describe('render', () => {
					it('open GENERAL', () => {
						sideNav.openChannel('general');
					});

					it('send a message to be tested', () => {
						mainContent.sendMessage('Message for Message Actions Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('should show the message action menu', () => {
						mainContent.messageActionMenu.isVisible().should.be.true;
					});

					it('should show the reply action', () => {
						mainContent.messageReply.isVisible().should.be.true;
					});

					it('should show the edit action', () => {
						mainContent.messageEdit.isVisible().should.be.true;
					});

					it('should show the delete action', () => {
						mainContent.messageDelete.isVisible().should.be.true;
					});

					it('should show the permalink action', () => {
						mainContent.messagePermalink.isVisible().should.be.true;
					});

					it('should show the copy action', () => {
						mainContent.messageCopy.isVisible().should.be.true;
					});

					it('should show the quote the action', () => {
						mainContent.messageQuote.isVisible().should.be.true;
					});

					it('should show the star action', () => {
						mainContent.messageStar.isVisible().should.be.true;
					});

					it('should show the reaction action', () => {
						mainContent.messageReaction.isVisible().should.be.true;
					});

					it('should show the close action', () => {
						mainContent.messageClose.isVisible().should.be.true;
					});

					it('should not show the pin action', () => {
						mainContent.messagePin.isVisible().should.be.false;
					});

					it('should not show the mark as unread action', () => {
						mainContent.messageUnread.isVisible().should.be.false;
					});

					it('close the action menu', () => {
						mainContent.selectAction('close');
					});
				});

				describe('usage', () => {
					it('send a message to test the reply', () => {
						mainContent.sendMessage('Message for reply Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('reply the message', () => {
						mainContent.selectAction('reply');
						mainContent.sendBtn.click();
					});

					it('checks if the message was replied', () => {
						mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
					});

					it('send a message to test the edit', () => {
						mainContent.addTextToInput('Message for Message edit Tests ');
						mainContent.sendBtn.click();
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('edit the message', () => {
						mainContent.selectAction('edit');
						mainContent.sendBtn.click();
					});

					it('send a message to test the delete', () => {
						mainContent.sendMessage('Message for Message Delete Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('delete the message', () => {
						mainContent.selectAction('delete');
						mainContent.popupFileConfirmBtn.click();
					});

					it('should not show the deleted message', () => {
						mainContent.lastMessage.should.not.equal('Message for Message Delete Tests');
					});

					it('send a message to test the quote', () => {
						mainContent.sendMessage('Message for quote Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('quote the message', () => {
						mainContent.selectAction('quote');
						mainContent.sendBtn.click();
					});

					it('checks if the message was quoted', () => {
						mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
					});

					it('send a message to test the star', () => {
						mainContent.sendMessage('Message for star Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('star the message', () => {
						mainContent.selectAction('star');
					});

					it('send a message to test the copy', () => {
						mainContent.sendMessage('Message for copy Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('copy the message', () => {
						mainContent.selectAction('copy');
					});

					it('send a message to test the permalink', () => {
						mainContent.sendMessage('Message for permalink Tests');
					});

					it('open the message action menu', () => {
						mainContent.openMessageActionMenu();
					});

					it('permalink the message', () => {
						mainContent.selectAction('permalink');
					});
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
				browser.pause(3000);
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

			it('should show the members search bar', () => {
				flexTab.userSearchBar.isVisible().should.be.true;
			});

			it('should show the show all link', () => {
				flexTab.showAll.isVisible().should.be.true;
			});

			it('should show the start video call button', () => {
				flexTab.startVideoCall.isVisible().should.be.true;
			});

			it('should show the start audio call', () => {
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

		it('should show the last message', () => {
			mainContent.lastMessage.isVisible().should.be.true;
		});

		it('the last message should be from the loged user', () => {
			mainContent.lastMessageUser.getText().should.equal(username);
		});

		it('should not show the Admin tag', () => {
			mainContent.lastMessageUserTag.isVisible().should.be.false;
		});

		describe('messages actions in direct messages', ()=> {
			describe('render', () => {
				it('open GENERAL', () => {
					sideNav.openChannel('general');
				});

				it('send a message to be tested', () => {
					mainContent.sendMessage('Message for Message Actions Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('should show the message action menu', () => {
					mainContent.messageActionMenu.isVisible().should.be.true;
				});

				it('should show the reply action', () => {
					mainContent.messageReply.isVisible().should.be.true;
				});

				it('should show the edit action', () => {
					mainContent.messageEdit.isVisible().should.be.true;
				});

				it('should show the delete action', () => {
					mainContent.messageDelete.isVisible().should.be.true;
				});

				it('should show the permalink action', () => {
					mainContent.messagePermalink.isVisible().should.be.true;
				});

				it('should show the copy action', () => {
					mainContent.messageCopy.isVisible().should.be.true;
				});

				it('should show the quote the action', () => {
					mainContent.messageQuote.isVisible().should.be.true;
				});

				it('should show the star action', () => {
					mainContent.messageStar.isVisible().should.be.true;
				});

				it('should show the reaction action', () => {
					mainContent.messageReaction.isVisible().should.be.true;
				});

				it('should show the close action', () => {
					mainContent.messageClose.isVisible().should.be.true;
				});

				it('should not show the pin action', () => {
					mainContent.messagePin.isVisible().should.be.false;
				});

				it('should not show the mark as unread action', () => {
					mainContent.messageUnread.isVisible().should.be.false;
				});

				it('close the action menu', () => {
					mainContent.selectAction('close');
				});
			});

			describe('usage', () => {
				it('send a message to test the reply', () => {
					mainContent.sendMessage('Message for reply Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('reply the message', () => {
					mainContent.selectAction('reply');
					mainContent.sendBtn.click();
				});

				it('checks if the message was replied', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});

				it('send a message to test the edit', () => {
					mainContent.addTextToInput('Message for Message edit Tests ');
					mainContent.sendBtn.click();
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('edit the message', () => {
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
				});

				it('send a message to test the delete', () => {
					mainContent.sendMessage('Message for Message Delete Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('delete the message', () => {
					mainContent.selectAction('delete');
					mainContent.popupFileConfirmBtn.click();
				});

				it('should not show the deleted message', () => {
					mainContent.lastMessage.should.not.equal('Message for Message Delete Tests');
				});

				it('send a message to test the quote', () => {
					mainContent.sendMessage('Message for quote Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('quote the message', () => {
					mainContent.selectAction('quote');
					mainContent.sendBtn.click();
				});

				it('checks if the message was quoted', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});

				it('send a message to test the star', () => {
					mainContent.sendMessage('Message for star Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('star the message', () => {
					mainContent.selectAction('star');
				});

				it('send a message to test the copy', () => {
					mainContent.sendMessage('Message for copy Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('copy the message', () => {
					mainContent.selectAction('copy');
				});

				it('send a message to test the permalink', () => {
					mainContent.sendMessage('Message for permalink Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('permalink the message', () => {
					mainContent.selectAction('permalink');
				});
			});
		});
	});

	describe('public channel', () => {
		it('create a public channel', () => {
			sideNav.createChannel(publicChannelName, false, false);
		});

		it('open the public channel', () => {
			sideNav.openChannel(publicChannelName);
			browser.pause(5000);
		});

		it('send a message in the public channel', () => {
			mainContent.sendMessage(message);
		});

		it('should show the last message', () => {
			mainContent.lastMessage.isVisible().should.be.true;
		});

		it('the last message should be from the loged user', () => {
			mainContent.lastMessageUser.getText().should.equal(username);
		});

		it('should not show the Admin tag', () => {
			var messageTag = mainContent.lastMessageUserTag.getText();
			messageTag.should.not.equal('Admin');
		});

		it('should show the Owner tag', () => {
			var messageTag = mainContent.lastMessageUserTag.getText();
			messageTag.should.equal('Owner');
		});

		it('add people to the room', () => {
			flexTab.membersTab.click();
			flexTab.addPeopleToChannel(targetUser);
		});

		it('remove people from room', () => {
			flexTab.removePeopleFromChannel(targetUser);
			flexTab.confirmPopup();
		});

		it.skip('archive the room', () => {
			flexTab.channelTab.click();
			flexTab.archiveChannel();
			flexTab.channelTab.click();
		});

		it('open GENERAL', () => {
			sideNav.openChannel('general');
		});
	});

	describe('private channel', () => {
		it('create a private channel', () => {
			sideNav.createChannel(privateChannelName, true, false);
		});

		it('send a message in the private channel', () => {
			mainContent.sendMessage(message);
		});

		describe('messages actions in private room', ()=> {
			describe('render', () => {
				it('send a message to be tested', () => {
					mainContent.sendMessage('Message for Message Actions Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('should show the message action menu', () => {
					mainContent.messageActionMenu.isVisible().should.be.true;
				});

				it('should show the reply action', () => {
					mainContent.messageReply.isVisible().should.be.true;
				});

				it('should show the edit action', () => {
					mainContent.messageEdit.isVisible().should.be.true;
				});

				it('should show the delete action', () => {
					mainContent.messageDelete.isVisible().should.be.true;
				});

				it('should show the permalink action', () => {
					mainContent.messagePermalink.isVisible().should.be.true;
				});

				it('should show the copy action', () => {
					mainContent.messageCopy.isVisible().should.be.true;
				});

				it('should show the quote the action', () => {
					mainContent.messageQuote.isVisible().should.be.true;
				});

				it('should show the star action', () => {
					mainContent.messageStar.isVisible().should.be.true;
				});

				it('should show the reaction action', () => {
					mainContent.messageReaction.isVisible().should.be.true;
				});

				it('should show the close action', () => {
					mainContent.messageClose.isVisible().should.be.true;
				});

				it('should show show the pin action', () => {
					mainContent.messagePin.isVisible().should.be.true;
				});

				it('should not show the mark as unread action', () => {
					mainContent.messageUnread.isVisible().should.be.false;
				});

				it('close the action menu', () => {
					mainContent.selectAction('close');
				});
			});

			describe('usage', () => {
				it('send a message to test the reply', () => {
					mainContent.sendMessage('Message for reply Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('reply the message', () => {
					mainContent.selectAction('reply');
					mainContent.sendBtn.click();
				});

				it('checks if the message was replied', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});

				it('send a message to test the edit', () => {
					mainContent.addTextToInput('Message for Message edit Tests ');
					mainContent.sendBtn.click();
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('edit the message', () => {
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
				});

				it('send a message to test the delete', () => {
					mainContent.sendMessage('Message for Message Delete Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('delete the message', () => {
					mainContent.selectAction('delete');
					mainContent.popupFileConfirmBtn.click();
				});

				it('should not show the deleted message', () => {
					mainContent.lastMessage.should.not.equal('Message for Message Delete Tests');
				});

				it('send a message to test the quote', () => {
					mainContent.sendMessage('Message for quote Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('quote the message', () => {
					mainContent.selectAction('quote');
					mainContent.sendBtn.click();
				});

				it('checks if the message was quoted', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});

				it('send a message to test the star', () => {
					mainContent.sendMessage('Message for star Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('star the message', () => {
					mainContent.selectAction('star');
				});

				it('send a message to test the copy', () => {
					mainContent.sendMessage('Message for copy Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('copy the message', () => {
					mainContent.selectAction('copy');
				});

				it('send a message to test the permalink', () => {
					mainContent.sendMessage('Message for permalink Tests');
				});

				it('open the message action menu', () => {
					mainContent.openMessageActionMenu();
				});

				it('permalink the message', () => {
					mainContent.selectAction('permalink');
				});
			});
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
