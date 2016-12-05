/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//test data imports
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../test-data/user.js';
import {publicChannelName, privateChannelName} from '../test-data/channel.js';
import {targetUser, imgURL} from '../test-data/interactions.js';
import {checkIfUserIsValid, publicChannelCreated, privateChannelCreated, directMessageCreated, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated} from '../test-data/checks';
import {username, email, password} from '../test-data/user.js';

//Test data
const message = 'message from '+username;

function messagingTest() {
	describe('Normal message', ()=> {
		it('send a message', () => {
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
	});

	describe('fileUpload', ()=> {
		it('send a attachment', () => {
			mainContent.fileUpload(imgURL);
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
}

function messageActionsTest() {
	describe('Message actions', ()=> {
		it('send a message to be tested', () => {
			mainContent.sendMessage('Message for Message Actions Tests');
		});
		describe('Message Actuins Render', ()=> {
			before(() => {
				mainContent.openMessageActionMenu();
			});

			after(() => {
				mainContent.selectAction('close');
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
		});

		describe('Message Actions usage'() => {
			describe('Message Reply'() => {
				before(() => {
					mainContent.openMessageActionMenu();
				});
				it('reply the message', () => {
					mainContent.selectAction('reply');
					mainContent.sendBtn.click();
				});

				it('checks if the message was replied', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});
			});


			describe('Message edit', () => {
				before(() => {
					mainContent.sendMessage('Message for Message edit Tests ');
					mainContent.openMessageActionMenu();
				});

				it('edit the message', () => {
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
				});
			});


			describe('Message delete', () => {
				before(() => {
					mainContent.sendMessage('Message for Message Delete Tests');
					mainContent.openMessageActionMenu();
				});

				it('delete the message', () => {
					mainContent.selectAction('delete');
					mainContent.popupFileConfirmBtn.click();
				});

				it('should not show the deleted message', () => {
					mainContent.lastMessage.should.not.equal('Message for Message Delete Tests');
				});
			});

			describe('Message quote', () => {
				before(() => {
					mainContent.sendMessage('Message for quote Tests');
					mainContent.openMessageActionMenu();
				});

				it('quote the message', () => {
					mainContent.selectAction('quote');
					mainContent.sendBtn.click();
				});

				it('checks if the message was quoted', () => {
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
				});
			});

			describe('Message star', () => {
				before(() => {
					mainContent.sendMessage('Message for star Tests');
					mainContent.openMessageActionMenu();
				});

				it('star the message', () => {
					mainContent.selectAction('star');
				});
			});

			describe('Message star', () => {
				before(() => {
					mainContent.sendMessage('Message for copy Tests');
					mainContent.openMessageActionMenu();
				});

				it('copy the message', () => {
					mainContent.selectAction('copy');
				});
			});

			describe('Message star', () => {
				before(() => {
					mainContent.sendMessage('Message for permalink Tests');
					mainContent.openMessageActionMenu();
				});

				it('permalink the message', () => {
					mainContent.selectAction('permalink');
				});
			});
		});
	});
}

describe('Messaging in different channels', () => {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
	});

	describe('Messaging in GENERAL channel', () => {
		before(()=>{
			sideNav.openChannel('general');
		});
		messagingTest();
	});

	describe('Messaging in created public channel', () => {
		before(()=>{
			if (!publicChannelCreated) {
				sideNav.createChannel(publicChannelName, false, false);
				setPublicChannelCreated(true);
				console.log('	public channel not found, creating one...');
			}
			sideNav.openChannel(publicChannelName);
		});
		messagingTest();
	});

	describe('Messaging in created private channel', () => {
		before(()=>{
			if (!privateChannelCreated) {
				sideNav.createChannel(privateChannelName, true, false);
				setPrivateChannelCreated(true);
				console.log('	private channel not found, creating one...');
			}
			sideNav.openChannel(privateChannelName);
		});
		messagingTest();
	});

	describe('Messaging in created direct message', () => {
		before(()=>{
			if (!publicChannelCreated) {
				sideNav.startDirectMessage(targetUser);
				setDirectMessageCreated(true);
				console.log('	Direct message not found, creating one...');
			}
			sideNav.openChannel(publicChannelName);
		});
		messagingTest();
	});
});