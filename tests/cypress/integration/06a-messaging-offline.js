import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import Global from '../pageobjects/global';
import { username, email, password } from '../../data/user.js';
import { fileName } from '../../data/interactions.js';
import { checkIfUserIsValid } from '../../data/checks';
import {
	api,
	request,
	credentials,
	getCredentials,
} from '../../data/api-data.js';

const storage = {
	db: 'localforage',
	transaction: 'keyvaluepairs',
	store: 'chatMessage',
};
const version = 'viasat-0.1';
const message = `message on ${ Date.now() }`;

function isOfflineMsg({ msg, message, action }) {
	return !!(msg && msg.msg === message && msg.temp && msg.tempActions && msg.tempActions[action]);
}

function isOfflineAttachment({ msg, message, action }) {
	const exist = msg && msg.attachments && msg.attachments[0] && msg.attachments[0].description === message;
	if (exist) {
		cy.window().then(() => {
			caches.open(version).then((storage) => {
				storage.match(msg.attachments[0].image_url).then((response) => {
					expect(response.status).to.equal(200);
				});
			});
		});
	}
	return !!(exist && msg.temp && msg.tempActions && msg.tempActions[action] && msg.uploads && msg.uploads.percentage === 0);
}

function isOnlineMsg({ msg, message }) {
	return !!(msg && msg.msg === message && !msg.temp && !msg.tempActions);
}

function isOnlineAttachment({ msg, message }) {
	return !!(msg && msg.attachments && msg.attachments[0] && msg.attachments[0].description === message && !msg.temp && !msg.tempActions);
}

function testMsgFromForge(message, attachment = false, callback) {
	cy.window().then(async () => {
		await new Promise((done) => {
			indexedDB.open(storage.db).onsuccess = (event) => {
				const _db = event.target.result;
				const tx = _db.transaction(storage.transaction);
				const _store = tx.objectStore(storage.transaction);

				_store.openCursor(storage.store).onsuccess = (event) => {
					const cursor = event.target.result;
					if (cursor && cursor.value && cursor.value.records) {
						const msgs = cursor.value.records;
						const msg = msgs && (attachment ? msgs.find((msg) => msg.attachments && msg.attachments[0] && msg.attachments[0].description === message) : msgs.find((msg) => msg.msg === message));
						callback(msg);
						done();
					}
				};
			};
		});
	});
}

function offlineMessageTest(message, action) {
	it('it should save the message in localforge', () => {
		testMsgFromForge(message, false, (msg) => {
			expect(isOfflineMsg({ msg, message, action })).to.equal(true);
		});
	});

	it('it should show the offline message after refresh', () => {
		mainContent.lastMessage.should('be.visible');
		mainContent.lastMessage.should('contain', message);
	});

	it(`it should ${ action } the offline message after coming online`, () => {
		mainContent.offlineMode(false);
		cy.wait(6000); // wait for the indexedDb to update the message + reconnect time
		if (action === 'delete') {
			testMsgFromForge(message, false, (msg) => {
				expect(msg === undefined).to.equal(true);
			});
		} else {
			testMsgFromForge(message, false, (msg) => {
				expect(isOnlineMsg({ msg, message })).to.equal(true);
			});
		}
	});
}

function sendMessageRequest(done = () => {}) {
	request.post(api('chat.sendMessage'))
		.set(credentials)
		.send({ message: { _id: `id-${ Date.now() }`, rid: 'GENERAL', msg: `Check ${ message }` } })
		.expect('Content-Type', 'application/json')
		.expect(200)
		.end(done);
}

describe('[Message]', () => {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.openChannel('general');
		cy.wait(3000); // time to cache the process.
	});

	describe('Normal message:', () => {
		beforeEach(() => {
			mainContent.offlineMode(true);
		});

		it('it should show reconnecting alert', () => {
			mainContent.warningAlert.should('be.visible');
		});

		it('it should send a message in offline', () => {
			mainContent.sendMessage(message);
			cy.wait(1000); // wait for the indexedDb to update the message
		});

		offlineMessageTest(message, 'send');
	});

	describe('[Actions]', () => {
		describe('Render:', () => {
			before(() => {
				mainContent.offlineMode(true);
				mainContent.openMessageActionMenu();
			});

			after(() => {
				mainContent.popoverWrapper.click();
			});

			it('it should show the message action menu and the actions', () => {
				mainContent.messageActionMenu.should('be.visible');
				mainContent.messageReply.should('be.visible');
				mainContent.messageEdit.should('be.visible');
				mainContent.messageDelete.should('be.visible');
				mainContent.messagePermalink.should('be.visible');
				mainContent.messageCopy.should('be.visible');
				mainContent.messageQuote.should('be.visible');
				mainContent.messageStar.should('be.visible');
				mainContent.messagePin.should('not.be.visible');
				mainContent.messageUnread.should('not.be.visible');
			});
		});

		describe('[Usage]', () => {
			beforeEach(() => {
				mainContent.offlineMode(true);
			});

			describe('Edit:', () => {
				it('it should edit the message', () => {
					mainContent.openMessageActionMenu();
					mainContent.selectAction('edit');
					mainContent.sendBtn.click();
					cy.wait(1000); // time to update indexedDb
				});

				offlineMessageTest(`${ message }this message was edited`, 'update');
			});

			describe('Delete:', () => {
				it('it should delete the message', () => {
					mainContent.openMessageActionMenu();
					mainContent.selectAction('delete');
					Global.modalConfirm.click();
					Global.modalOverlay.should('not.be.visible');
					cy.wait(1000);
				});

				it('it should not show the deleted message', () => {
					mainContent.lastMessage.should('contain', 'Message deleted');
				});

				offlineMessageTest('Message deleted', 'delete');
			});
		});
	});

	describe('fileUpload:', () => {
		beforeEach(() => {
			mainContent.offlineMode(true);
		});

		it('it should send an attachment in offline', () => {
			mainContent.fileUpload(fileName);
			Global.modalConfirm.should('be.visible');
			Global.modalCancel.should('be.visible');
			Global.modalFilePreview.should('be.visible');
			Global.modalFileTitle.should('be.visible');
			Global.modalFileName.should('be.visible');
			Global.modalFileName.type('File Name');
			Global.modalFileDescription.should('be.visible');
			Global.modalFileDescription.type(message);
			Global.modalConfirm.click();
			cy.wait(3000);
		});

		it('it should show the file in the message', () => {
			mainContent.lastMessageDesc.invoke('text').should('contain', message);
		});

		it('it should save the file in localforge', () => {
			testMsgFromForge(message, true, (msg) => {
				expect(isOfflineAttachment({ msg, message, action: 'send' })).to.equal(true);
			});
		});

		it('it should show the file after refresh', () => {
			cy.reload();
			mainContent.lastMessageDesc.should('be.visible');
			mainContent.lastMessageDesc.invoke('text').should('contain', message);
		});

		it('it should send the file after coming online', () => {
			mainContent.offlineMode(false);
			cy.wait(6000); // wait for the indexedDb to update the message + reconnect time
			testMsgFromForge(message, true, (msg) => {
				expect(isOnlineAttachment({ msg, message })).to.equal(true);
			});
		});
	});

	describe('Message retain:', () => {
		before((done) => {
			getCredentials(done);
		});

		it('it should send API message request', (done) => {
			sendMessageRequest(done);
		});

		it('it should show the message after refresh', () => {
			cy.reload();
			mainContent.lastMessage.should('be.visible');
			mainContent.lastMessage.should('contain', `Check ${ message }`);
			cy.wait(3000);
		});
	});
});
