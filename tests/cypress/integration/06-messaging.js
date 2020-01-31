import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import Global from '../pageobjects/global';
import { username, email, password } from '../../data/user.js';
import { publicChannelName, privateChannelName } from '../../data/channel.js';
import { targetUser, imgURL } from '../../data/interactions.js';
import { checkIfUserIsValid, publicChannelCreated, privateChannelCreated, directMessageCreated, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated } from '../../data/checks';


// Test data
const message = `message from ${ username }`;

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
				mainContent.lastMessageUser.should('contain', username);
			});
		}

		if (currentTest === 'general') {
			it('it should not show the Admin tag', () => {
				mainContent.lastMessageUserTag.should('not.be.visible');
			});
		}
	});

	describe.skip('fileUpload:', () => {
		after(() => {
		});
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

function messageActionsTest(currentTest) {
	describe('[Actions]', () => {
		before(() => {
			mainContent.sendMessage('Message for Message Actions Tests');
		});
		describe('Render:', () => {
			before(() => {
				mainContent.openMessageActionMenu();
			});

			after(() => {
				mainContent.popoverWrapper.click();
			});

			it('it should show the message action menu', () => {
				mainContent.messageActionMenu.should('be.visible');
			});

			it('it should show the edit action', () => {
				mainContent.messageEdit.should('be.visible');
			});

			it('it should show the delete action', () => {
				mainContent.messageDelete.should('be.visible');
			});

			it('it should show the permalink action', () => {
				mainContent.messagePermalink.should('be.visible');
			});

			it('it should show the copy action', () => {
				mainContent.messageCopy.should('be.visible');
			});

			it('it should show the quote the action', () => {
				mainContent.messageQuote.should('be.visible');
			});

			it('it should show the star action', () => {
				mainContent.messageStar.should('be.visible');
			});

			if (currentTest === 'general') {
				it('it should not show the pin action', () => {
					mainContent.messagePin.should('not.be.visible');
				});
			}

			it('it should not show the mark as unread action', () => {
				mainContent.messageUnread.should('not.be.visible');
			});
		});

		describe('[Usage]', () => {
			describe('Reply:', () => {
				before(() => {
					mainContent.messageOptionsBtns.invoke('show');
				});

				it('it should reply the message', () => {
					mainContent.selectAction('reply');
					mainContent.sendBtn.click();
				});

				it('it should check if the message was replied', () => {
					mainContent.beforeLastMessageQuote.then(($el) => {
						const text = $el.data('id');
						mainContent.lastMessageQuote.should('has.attr', 'data-tmid', text);
					});
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
					Global.modalOverlay.should('not.be.visible');
				});

				it('it should not show the deleted message', () => {
					mainContent.lastMessage.should('not.contain', 'Message for Message Delete Tests');
				});
			});

			describe('Quote:', () => {
				const message = `Message for quote Tests - ${ Date.now() }`;

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
		messageActionsTest('general');
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
		messageActionsTest('public');
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
		messageActionsTest('private');
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
	});
});
