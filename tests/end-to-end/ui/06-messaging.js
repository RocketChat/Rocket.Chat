/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import Global from '../../pageobjects/global';

//test data imports
import {username, email, password} from '../../data/user.js';
import {publicChannelName, privateChannelName} from '../../data/channel.js';
import {targetUser, imgURL} from '../../data/interactions.js';
import {checkIfUserIsValid, publicChannelCreated, privateChannelCreated, directMessageCreated, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated} from '../../data/checks';


//Test data
const message = `message from ${ username }`;
let currentTest = 'none';

function messagingTest() {
	describe('Normal message:', ()=> {
		it('it should send a message', () => {
			mainContent.sendMessage(message);
		});

		it('it should show the last message', () => {
			mainContent.lastMessage.isVisible().should.be.true;
		});

		if (!currentTest === 'direct') {
			it('it should be that the last message is from the loged user', () => {
				mainContent.lastMessageUser.getText().should.equal(username);
			});
		}

		if (currentTest === 'general') {
			it('it should not show the Admin tag', () => {
				mainContent.lastMessageUserTag.isVisible().should.be.false;
			});
		}
	});

	describe('fileUpload:', ()=> {
		after(() => {
		});
		it('it should send a attachment', () => {
			mainContent.fileUpload(imgURL);
		});

		it('it should show the confirm button', () => {
			Global.modalConfirm.isVisible().should.be.true;
		});

		it('it should show the cancel button', () => {
			Global.modalCancel.isVisible().should.be.true;
		});

		it('it should show the file preview', () => {
			Global.modalFilePreview.isVisible().should.be.true;
		});

		it('it should show the confirm button', () => {
			Global.modalConfirm.isVisible().should.be.true;
		});

		it('it should show the file title', () => {
			Global.modalFileTitle.isVisible().should.be.true;
		});

		it('it should show the file name input', () => {
			Global.modalFileName.isVisible().should.be.true;
		});

		it('it should fill the file name input', () => {
			Global.modalFileName.setValue('File Name');
		});

		it('it should show the file name input', () => {
			Global.modalFileDescription.isVisible().should.be.true;
		});

		it('it should fill the file name input', () => {
			Global.modalFileDescription.setValue('File Description');
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

function messageActionsTest() {
	describe('[Actions]', ()=> {
		before(() => {
			mainContent.sendMessage('Message for Message Actions Tests');
		});
		describe('Render:', ()=> {
			before(() => {
				mainContent.openMessageActionMenu();
			});

			after(() => {
				mainContent.popoverWrapper.click();
			});

			it('it should show the message action menu', () => {
				mainContent.messageActionMenu.isVisible().should.be.true;
			});

			it('it should show the reply action', () => {
				mainContent.messageReply.isVisible().should.be.true;
			});

			it('it should show the edit action', () => {
				mainContent.messageEdit.isVisible().should.be.true;
			});

			it('it should show the delete action', () => {
				mainContent.messageDelete.isVisible().should.be.true;
			});

			it('it should show the permalink action', () => {
				mainContent.messagePermalink.isVisible().should.be.true;
			});

			it('it should show the copy action', () => {
				mainContent.messageCopy.isVisible().should.be.true;
			});

			it('it should show the quote the action', () => {
				mainContent.messageQuote.isVisible().should.be.true;
			});

			it('it should show the star action', () => {
				mainContent.messageStar.isVisible().should.be.true;
			});

			// it('it should show the reaction action', () => {
			// 	mainContent.messageReaction.isVisible().should.be.true;
			// });

			// it('it should show the close action', () => {
			// 	mainContent.messageClose.isVisible().should.be.true;
			// });

			if (currentTest === 'general') {
				it('it should not show the pin action', () => {
					mainContent.messagePin.isVisible().should.be.false;
				});
			}

			it('it should not show the mark as unread action', () => {
				mainContent.messageUnread.isVisible().should.be.false;
			});
		});

		describe('[Usage]', () => {
			describe('Reply:', () => {
				before(() => {
					mainContent.openMessageActionMenu();
				});
				it('it should reply the message', () => {
					mainContent.selectAction('reply');
					mainContent.sendBtn.click();
				});

				it('it should check if the message was replied', () => {
					mainContent.lastMessageTextAttachment.waitForVisible(5000);
					mainContent.lastMessageTextAttachment.getText().should.equal(mainContent.beforeLastMessage.getText());
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
					Global.modalOverlay.waitForVisible(3000, true);
				});

				it('it should not show the deleted message', () => {
					mainContent.lastMessage.should.not.equal('Message for Message Delete Tests');
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
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.click();
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});


	describe('[GENERAL Channel]', () => {
		before(()=>{
			checkIfUserIsValid(username, email, password);
			sideNav.spotlightSearchIcon.click();
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel('general');
			currentTest = 'general';
		});
		messagingTest();
		messageActionsTest();
	});

	describe('[Public Channel]', () => {
		before(()=>{
			if (!publicChannelCreated) {
				sideNav.createChannel(publicChannelName, false, false);
				setPublicChannelCreated(true);
				console.log('	public channel not found, creating one...');
			}
			currentTest = 'public';
			sideNav.openChannel(publicChannelName);
		});
		messagingTest();
		messageActionsTest();
	});

	describe('[Private Channel]', () => {
		before(()=>{
			if (!privateChannelCreated) {
				sideNav.createChannel(privateChannelName, true, false);
				setPrivateChannelCreated(true);
				console.log('	private channel not found, creating one...');
			}
			currentTest = 'private';
			sideNav.openChannel(privateChannelName);
		});
		messagingTest();
		messageActionsTest();
	});

	describe('[Direct Message]', () => {
		before(()=>{
			if (!directMessageCreated) {
				sideNav.searchChannel(targetUser);
				setDirectMessageCreated(true);
				console.log('	Direct message not found, creating one...');
			}
			currentTest = 'direct';
			sideNav.openChannel(publicChannelName);
		});
		messagingTest();
	});
});
