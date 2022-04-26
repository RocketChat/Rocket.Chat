import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import Global from '../pageobjects/global';
import { username, email, password } from '../../data/user.js';
import { publicChannelName, privateChannelName } from '../../data/channel.js';
import { targetUser, imgURL } from '../../data/interactions.js';
import {
	checkIfUserIsValid,
	publicChannelCreated,
	privateChannelCreated,
	directMessageCreated,
	setPublicChannelCreated,
	setPrivateChannelCreated,
	setDirectMessageCreated,
} from '../../data/checks';
import { updatePermission } from '../../data/permissions.helper';
import { api, getCredentials, credentials, request } from '../../data/api-data';
import { createUser, login } from '../../data/users.helper';

// Test data
const message = `message from ${username}`;
let testDMUsername;

function messagingTest(currentTest) {
	describe('Normal message:', () => {
		it('it should send a message', () => {
			mainContent.sendMessage(message);
		});

		it('it should show the last message', () => {
			mainContent.lastMessage.should('be.visible');
		});

		if (currentTest !== 'direct') {
			it('it should be that the last message is from the logged user', () => {
				mainContent.lastMessage.should('contain', username);
			});
		}

		if (currentTest === 'general') {
			it('it should not show the Admin tag', () => {
				mainContent.lastMessageUserTag.should('not.exist');
			});
		}
	});

	describe.skip('fileUpload:', () => {
		after(() => {});
		it('it should send a attachment', () => {
			mainContent.fileUpload(imgURL);
		});

		it('it should show the confirm button', () => {
			Global.modalConfirm.should('be.visible');
		});

		it('it should show the cancel button', () => {
			Global.modalCancel.should('be.visible');
		});

		it('it should show the file preview', () => {
			Global.modalFilePreview.should('be.visible');
		});

		it('it should show the confirm button', () => {
			Global.modalConfirm.should('be.visible');
		});

		it('it should show the file title', () => {
			Global.modalFileTitle.should('be.visible');
		});

		it('it should show the file name input', () => {
			Global.modalFileName.should('be.visible');
		});

		it('it should fill the file name input', () => {
			Global.modalFileName.type('File Name');
		});

		it('it should show the file name input', () => {
			Global.modalFileDescription.should('be.visible');
		});

		it('it should fill the file name input', () => {
			Global.modalFileDescription.type('File Description');
		});

		it('it should click the confirm', () => {
			Global.modalConfirm.click();
			Global.modalConfirm.waitForVisible(5000, true);
		});

		it('it should show the file in the message', () => {
			mainContent.lastMessageDesc.waitForVisible(10000);
			mainContent.lastMessageDesc.getText().should.equal('File Description');
		});
	});
}

function grantCreateDPermission() {
	return new Promise((resolve) => {
		getCredentials(() => {
			updatePermission('create-d', ['user']).then(resolve);
		});
	});
}

function revokeCreateDPermission() {
	return new Promise((resolve) => {
		getCredentials(() => {
			updatePermission('create-d', []).then(resolve);
		});
	});
}

function toggleOpenMessageActionMenu() {
	mainContent.closeMessageActionMenu();
	mainContent.openMessageActionMenu();
}

function createDMUserAndPost(testChannel, done) {
	getCredentials(() => {
		createUser().then((createdUser) => {
			testDMUsername = createdUser.username;

			request
				.post(api('users.setActiveStatus'))
				.set(credentials)
				.send({
					activeStatus: true,
					userId: createdUser._id,
				})
				.then(() => {
					login(testDMUsername, password).then((userCredentials) => {
						request
							.post(api('chat.postMessage'))
							.set(userCredentials)
							.send({
								channel: testChannel,
								text: 'Message from Test DM user',
							})
							.end(done);
					});
				});
		});
	});
}

function leaveTestDM() {
	// Leave the existing DM
	const dmElement = sideNav.getChannelFromList(testDMUsername).scrollIntoView().rightclick().wait(800);
	dmElement.closest('.rcx-sidebar-item--clickable').find('.rcx-sidebar-item__menu-wrapper > button').click();
	sideNav.popOverHideOption.click();

	Global.modal.should('be.visible');
	Global.modalConfirm.click();
}

function messageActionsTest(currentTest, testChannel) {
	describe('[Actions]', () => {
		before(() => {
			mainContent.sendMessage('Message for Message Actions Tests');
		});
		describe('Render:', () => {
			before(() => {
				mainContent.openMessageActionMenu();
			});

			after(() => {
				mainContent.closeMessageActionMenu();
			});

			it('it should show the message action menu', () => {
				mainContent.messageActionMenu.should('be.visible');
			});

			it('it should show the edit action', () => {
				mainContent.messageEdit.scrollIntoView().should('be.visible');
			});

			it('it should show the delete action', () => {
				mainContent.messageDelete.scrollIntoView().should('be.visible');
			});

			it('it should show the permalink action', () => {
				mainContent.messagePermalink.scrollIntoView().should('be.visible');
			});

			it('it should show the copy action', () => {
				mainContent.messageCopy.scrollIntoView().should('be.visible');
			});

			it('it should show the quote the action', () => {
				mainContent.messageQuote.scrollIntoView().should('be.visible');
			});

			it('it should show the star action', () => {
				mainContent.messageStar.scrollIntoView().should('be.visible');
			});

			if (currentTest === 'general') {
				it('it should not show the pin action', () => {
					mainContent.messagePin.should('not.exist');
				});
			}

			it('it should not show the mark as unread action', () => {
				mainContent.messageUnread.should('not.exist');
			});

			if (currentTest === 'direct') {
				it('it should not show the Reply to DM action', () => {
					mainContent.messageReplyInDM.should('not.exist');
				});
			} else if (currentTest !== 'private') {
				context('when the channel last message was posted by someone else', () => {
					before((done) => {
						revokeCreateDPermission().then(() => {
							createDMUserAndPost(testChannel, done);
						});
					});

					it('it should not show the Reply to DM action', () => {
						toggleOpenMessageActionMenu();
						// We don't have the test DM user in a DM channel or have the `create-d` permission
						mainContent.messageReplyInDM.should('not.exist');
					});

					context('when the user has permission to create DMs', () => {
						before(() => grantCreateDPermission());
						after(() => revokeCreateDPermission());

						it('it should show the Reply to DM action', () => {
							toggleOpenMessageActionMenu();

							mainContent.messageReplyInDM.should('be.visible');
						});
					});

					context('when the user already has a created DM', () => {
						// Grant Create DM permission, create a DM, then revoke the permission
						before(() => grantCreateDPermission());

						before(() => {
							mainContent.closeMessageActionMenu();
							sideNav.spotlightSearchIcon.click();
							sideNav.searchChannel(testDMUsername);
						});

						before(() => revokeCreateDPermission());

						before(() => {
							sideNav.openChannel(testChannel);
							mainContent.openMessageActionMenu();
						});

						after(() => {
							mainContent.closeMessageActionMenu();
							leaveTestDM();
						});

						it('it should show the Reply to DM action', () => {
							mainContent.messageReplyInDM.should('be.visible');
						});
					});
				});
			}
		});

		describe('[Usage]', () => {
			describe('Reply:', () => {
				it('it should reply the message', () => {
					toggleOpenMessageActionMenu();

					mainContent.selectAction('reply');
					flexTab.sendBtn.click();
				});

				it('it should check if the message was replied', () => {
					mainContent.beforeLastMessageQuote.then(($el) => {
						const text = $el.data('id');
						mainContent.lastMessageQuote.should('has.attr', 'data-tmid', text);
					});
					flexTab.threadTab.click();
				});
			});

			describe('Edit:', () => {
				before(() => {
					mainContent.sendMessage('Message for Message edit Tests');
					mainContent.openMessageActionMenu();
				});

				it('it should edit the message', () => {
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
				});
			});

			describe('Delete:', () => {
				before(() => {
					mainContent.sendMessage('Message for Message Delete Tests');
					mainContent.openMessageActionMenu();
				});

				it('it should delete the message', () => {
					mainContent.selectAction('delete');
					Global.modalConfirm.click();
					Global.modalOverlay.should('not.exist');
				});

				it('it should not show the deleted message', () => {
					mainContent.lastMessage.should('not.contain', 'Message for Message Delete Tests');
				});
			});

			describe('Quote:', () => {
				const message = `Message for quote Tests - ${Date.now()}`;

				before(() => {
					mainContent.sendMessage(message);
					mainContent.openMessageActionMenu();
				});

				it('it should quote the message', () => {
					mainContent.selectAction('quote');
					mainContent.sendBtn.click();
					mainContent.waitForLastMessageTextAttachmentEqualsText(message);
				});
			});

			describe('Star:', () => {
				before(() => {
					mainContent.sendMessage('Message for star Tests');
					mainContent.openMessageActionMenu();
				});

				it('it should star the message', () => {
					mainContent.selectAction('star');
				});
			});

			describe('Copy:', () => {
				before(() => {
					mainContent.sendMessage('Message for copy Tests');
					mainContent.openMessageActionMenu();
				});

				it('it should copy the message', () => {
					mainContent.selectAction('copy');
				});
			});

			describe('Permalink:', () => {
				before(() => {
					mainContent.sendMessage('Message for permalink Tests');
					mainContent.openMessageActionMenu();
				});

				it('it should permalink the message', () => {
					mainContent.selectAction('permalink');
				});
			});
		});
	});
}

describe('[Message]', () => {
	before(() => {
		checkIfUserIsValid(username, email, password);
	});

	describe('[GENERAL Channel]', () => {
		before(() => {
			sideNav.spotlightSearchIcon.click();
			sideNav.searchChannel('general');
		});
		messagingTest('general');
		messageActionsTest('general', 'general');
	});

	describe('[Public Channel]', () => {
		before(() => {
			if (!publicChannelCreated) {
				sideNav.createChannel(publicChannelName, false, false);
				setPublicChannelCreated(true);
				console.log('	public channel not found, creating one...');
			}
			sideNav.openChannel(publicChannelName);
		});
		messagingTest('public');
		messageActionsTest('public', publicChannelName);
	});

	describe('[Private Channel]', () => {
		before(() => {
			if (!privateChannelCreated) {
				sideNav.createChannel(privateChannelName, true, false);
				setPrivateChannelCreated(true);
				console.log('	private channel not found, creating one...');
			}
			sideNav.openChannel(privateChannelName);
		});
		messagingTest('private');
		messageActionsTest('private', privateChannelName);
	});

	describe('[Direct Message]', () => {
		before(() => {
			if (!directMessageCreated) {
				sideNav.spotlightSearchIcon.click();
				sideNav.searchChannel(targetUser);
				setDirectMessageCreated(true);
				console.log('	Direct message not found, creating one...');
			}
			sideNav.openChannel(targetUser);
		});
		messagingTest('direct');
		messageActionsTest('direct');
	});
});
