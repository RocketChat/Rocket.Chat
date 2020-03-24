import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import Global from '../../pageobjects/global';
import { username, email, password } from '../../../data/user.js';
import { imgURL } from '../../../data/interactions.js';
import { checkIfUserIsValid } from '../../../data/checks';

const storage = {
	db: 'localforage',
	transaction: 'keyvaluepairs',
	store: 'chatMessage',
};
const version = 'viasat-0.1';
const message = `message on ${ Date.now() }`;

function isOfflineMsg(msg, message, action) {
	return !!(msg && msg.msg === message && msg.temp && msg.tempActions && msg.tempActions[action]);
}

function isOfflineAttachment(msg, message, action) {
	let exist = msg && msg.attachments && msg.attachments[0] && msg.attachments[0].description === message;
	if (exist) {
		const { value } = browser.executeAsync((version, file, done) => {
			caches.open(version)
				.then((storage) => storage.match(file)
					.then((res) => done(res)));
		}, version, msg.attachments[0].image_url);
		exist = (value.status === 200);
	}
	return !!(exist && msg.temp && msg.tempActions && msg.tempActions[action] && msg.uploads && msg.uploads.percentage === 0);
}

function isOnlineMsg(msg, message) {
	return !!(msg && msg.msg === message && !msg.temp && !msg.tempActions);
}

function isOnlineAttachment(msg, message) {
	return !!(msg && msg.attachments && msg.attachments[0] && msg.attachments[0].description === message && !msg.temp && !msg.tempActions);
}

function getMsgFromIndexDB(message, attachment = false) {
	const { value: msgs } = browser.executeAsync(({ db, transaction, store }, done) => {
		indexedDB.open(db).onsuccess = (event) => {
			const _db = event.target.result;
			const tx = _db.transaction(transaction);
			const _store = tx.objectStore(transaction);

			_store.openCursor(store).onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor && cursor.value && cursor.value.records) {
					done(cursor.value.records);
				}
				done(null);
			};
		};
	}, storage);

	return msgs && (attachment ? msgs.find((msg) => msg.attachments && msg.attachments[0] && msg.attachments[0].description === message) : msgs.find((msg) => msg.msg === message));
}

function offlineMessageTest(message, action) {
	it('it should save the message in localforge', () => {
		isOfflineMsg(getMsgFromIndexDB(message), message, action).should.be.true;
	});

	it('it should show the offline message after refresh', () => {
		browser.refresh();
		mainContent.waitForLastMessageEqualsText(message);
	});

	it(`it should ${ action } the offline message after coming online`, () => {
		mainContent.offlineMode(false);
		browser.pause(8000); // wait for the indexedDb to update the message + reconnect time
		if (action === 'delete') {
			(getMsgFromIndexDB(message) === undefined).should.be.true;
		} else {
			isOnlineMsg(getMsgFromIndexDB(message), message).should.be.true;
		}
	});
}

describe('[Message]', () => {
	before(() => {
		mainContent.useProxy(true);
		checkIfUserIsValid(username, email, password);
		sideNav.openChannel('general');
		browser.pause(15000); // time to cache the process.
		mainContent.offlineMode(true);
		browser.refresh();
	});
	after(() => {
		mainContent.useProxy(false);
	});

	it('it should show reconnecting alert', () => {
		mainContent.warningAlert.waitForVisible(10000);
		mainContent.warningAlert.isVisible().should.be.true;
	});

	describe('Normal message:', () => {
		after(() => {
			mainContent.offlineMode(true);
			browser.refresh();
		});
		it('it should send a message in offline', () => {
			mainContent.sendMessage(message);
		});

		it('it should show the last message in offline', () => {
			mainContent.lastMessage.isVisible().should.be.true;
			browser.pause(1000); // wait for the indexedDb to update the message
		});

		offlineMessageTest(message, 'send');
	});

	describe.skip('fileUpload:', () => {
		after(() => {
			mainContent.offlineMode(true);
			browser.refresh();
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
			Global.modalFileDescription.setValue(message);
		});

		it('it should click the confirm', () => {
			Global.modalConfirm.click();
			Global.modalConfirm.waitForVisible(5000, true);
		});

		it('it should show the file in the message', () => {
			mainContent.lastMessageDesc.waitForVisible(10000);
			mainContent.lastMessageDesc.getText().should.equal(message);
			browser.pause(1000);
		});
		
		it('it should save the file in localforge', () => {
			isOfflineAttachment(getMsgFromIndexDB(message, true), message, 'send').should.be.true;
		});

		it('it should show the file after refresh', () => {
			browser.refresh();
			mainContent.lastMessageDesc.waitForVisible(10000);
			mainContent.lastMessageDesc.getText().should.equal(message);
		});

		it(`it should send the file after coming online`, () => {
			mainContent.offlineMode(false);
			browser.pause(8000); // wait for the indexedDb to update the message + reconnect time
			isOnlineAttachment(getMsgFromIndexDB(message, true), message).should.be.true;
		});
	});

	describe.skip('[Actions]', () => {
		describe('Render:', () => {
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

			it('it should not show the pin action', () => {
				mainContent.messagePin.isVisible().should.be.false;
			});

			it('it should not show the mark as unread action', () => {
				mainContent.messageUnread.isVisible().should.be.false;
			});
		});

		describe('[Usage]', () => {
			describe('Edit:', () => {
				before(() => {
					browser.pause(1000);
					mainContent.openMessageActionMenu();
				});

				it('it should edit the message', () => {
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
					browser.pause(1000);
				});

				offlineMessageTest(`${ message }this message was edited`, 'update');
			});

			describe('Delete:', () => {
				before(() => {
					mainContent.openMessageActionMenu();
				});

				it('it should delete the message', () => {
					mainContent.selectAction('delete');
					Global.modalConfirm.click();
					Global.modalOverlay.waitForVisible(3000, true);
					browser.pause(10000);
				});

				it('it should not show the deleted message', () => {
					mainContent.lastMessage.getText().should.equal('Message deleted');
				});

				offlineMessageTest('Message deleted', 'delete');
			});
		});
	});
});
