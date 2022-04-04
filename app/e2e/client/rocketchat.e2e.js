import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Emitter } from '@rocket.chat/emitter';

import { E2ERoom } from './rocketchat.e2e.room';
import {
	toString,
	toArrayBuffer,
	joinVectorAndEcryptedData,
	splitVectorAndEcryptedData,
	encryptAES,
	decryptAES,
	generateRSAKey,
	exportJWKKey,
	importRSAKey,
	importRawKey,
	deriveKey,
	generateMnemonicPhrase,
} from './helper';
import * as banners from '../../../client/lib/banners';
import { Rooms, Subscriptions, Messages } from '../../models/client';
import './events.js';
import './tabbar';
import { log, logError } from './logger';
import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import SaveE2EPasswordModal from '../../../client/views/e2e/SaveE2EPasswordModal';
import EnterE2EPasswordModal from '../../../client/views/e2e/EnterE2EPasswordModal';
import { call } from '../../../client/lib/utils/call';

let failedToDecodeKey = false;

class E2E extends Emitter {
	constructor() {
		super();
		this.started = false;
		this.enabled = new ReactiveVar(false);
		this._ready = new ReactiveVar(false);
		this.instancesByRoomId = {};

		this.on('ready', () => {
			this._ready.set(true);
			this.log('startClient -> Done');
			this.log('decryptSubscriptions');

			this.decryptSubscriptions();
			this.log('decryptSubscriptions -> Done');
		});
	}

	log(...msg) {
		log('E2E', ...msg);
	}

	error(...msg) {
		logError('E2E', ...msg);
	}

	isEnabled() {
		return this.enabled.get();
	}

	isReady() {
		return this.enabled.get() && this._ready.get();
	}

	async getInstanceByRoomId(rid) {
		const room = await waitUntilFind(() => Rooms.findOne({ _id: rid }));

		if (room.t !== 'd' && room.t !== 'p') {
			return null;
		}

		if (room.encrypted !== true && !room.e2eKeyId) {
			return null;
		}

		if (!this.instancesByRoomId[rid]) {
			this.instancesByRoomId[rid] = new E2ERoom(Meteor.userId(), rid, room.t);
		}

		return this.instancesByRoomId[rid];
	}

	removeInstanceByRoomId(rid) {
		delete this.instancesByRoomId[rid];
	}

	async startClient() {
		if (this.started) {
			return;
		}

		this.log('startClient -> STARTED');

		this.started = true;
		let public_key = Meteor._localStorage.getItem('public_key');
		let private_key = Meteor._localStorage.getItem('private_key');

		await this.loadKeysFromDB();

		if (!public_key && this.db_public_key) {
			public_key = this.db_public_key;
		}

		if (!private_key && this.db_private_key) {
			try {
				private_key = await this.decodePrivateKey(this.db_private_key);
			} catch (error) {
				this.started = false;
				failedToDecodeKey = true;
				this.openAlert({
					title: TAPi18n.__("Wasn't possible to decode your encryption key to be imported."),
					html: '<div>Your encryption password seems wrong. Click here to try again.</div>',
					modifiers: ['large', 'danger'],
					closable: true,
					icon: 'key',
					action: () => {
						this.startClient();
						this.closeAlert();
					},
				});
				return;
			}
		}

		if (public_key && private_key) {
			await this.loadKeys({ public_key, private_key });
		} else {
			await this.createAndLoadKeys();
		}

		// TODO: Split in 2 methods to persist keys
		if (!this.db_public_key || !this.db_private_key) {
			await call('e2e.setUserPublicAndPrivateKeys', {
				public_key: Meteor._localStorage.getItem('public_key'),
				private_key: await this.encodePrivateKey(Meteor._localStorage.getItem('private_key'), await this.createRandomPassword()),
			});
		}

		const randomPassword = Meteor._localStorage.getItem('e2e.randomPassword');
		if (randomPassword) {
			const passwordRevealText = TAPi18n.__('E2E_password_reveal_text', {
				postProcess: 'sprintf',
				sprintf: [randomPassword],
			});

			this.openAlert({
				title: TAPi18n.__('Save_Your_Encryption_Password'),
				html: TAPi18n.__('Click_here_to_view_and_copy_your_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => {
					imperativeModal.open({
						component: SaveE2EPasswordModal,
						props: {
							passwordRevealText,
							onClose: imperativeModal.close,
							onCancel: () => {
								this.closeAlert();
								imperativeModal.close();
							},
							onConfirm: () => {
								Meteor._localStorage.removeItem('e2e.randomPassword');
								this.closeAlert();
								imperativeModal.close();
							},
						},
					});
				},
			});
		}
		this.emit('ready');
	}

	async stopClient() {
		this.log('-> Stop Client');
		this.closeAlert();

		Meteor._localStorage.removeItem('public_key');
		Meteor._localStorage.removeItem('private_key');
		this.instancesByRoomId = {};
		this.privateKey = null;
		this.enabled.set(false);
		this._ready.set(false);
		this.started = false;
	}

	async changePassword(newPassword) {
		await call('e2e.setUserPublicAndPrivateKeys', {
			public_key: Meteor._localStorage.getItem('public_key'),
			private_key: await this.encodePrivateKey(Meteor._localStorage.getItem('private_key'), newPassword),
		});

		if (Meteor._localStorage.getItem('e2e.randomPassword')) {
			Meteor._localStorage.setItem('e2e.randomPassword', newPassword);
		}
	}

	async loadKeysFromDB() {
		try {
			const { public_key, private_key } = await call('e2e.fetchMyKeys');

			this.db_public_key = public_key;
			this.db_private_key = private_key;
		} catch (error) {
			return this.error('Error fetching RSA keys: ', error);
		}
	}

	async loadKeys({ public_key, private_key }) {
		Meteor._localStorage.setItem('public_key', public_key);

		try {
			this.privateKey = await importRSAKey(EJSON.parse(private_key), ['decrypt']);

			Meteor._localStorage.setItem('private_key', private_key);
		} catch (error) {
			return this.error('Error importing private key: ', error);
		}
	}

	async createAndLoadKeys() {
		// Could not obtain public-private keypair from server.
		let key;
		try {
			key = await generateRSAKey();
			this.privateKey = key.privateKey;
		} catch (error) {
			return this.error('Error generating key: ', error);
		}

		try {
			const publicKey = await exportJWKKey(key.publicKey);

			Meteor._localStorage.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			return this.error('Error exporting public key: ', error);
		}

		try {
			const privateKey = await exportJWKKey(key.privateKey);

			Meteor._localStorage.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			return this.error('Error exporting private key: ', error);
		}

		this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys() {
		call('e2e.requestSubscriptionKeys');
	}

	async createRandomPassword() {
		const randomPassword = await generateMnemonicPhrase(5);
		Meteor._localStorage.setItem('e2e.randomPassword', randomPassword);
		return randomPassword;
	}

	async encodePrivateKey(private_key, password) {
		const masterKey = await this.getMasterKey(password);

		const vector = crypto.getRandomValues(new Uint8Array(16));
		try {
			const encodedPrivateKey = await encryptAES(vector, masterKey, toArrayBuffer(private_key));

			return EJSON.stringify(joinVectorAndEcryptedData(vector, encodedPrivateKey));
		} catch (error) {
			return this.error('Error encrypting encodedPrivateKey: ', error);
		}
	}

	async getMasterKey(password) {
		if (password == null) {
			alert('You should provide a password');
		}

		// First, create a PBKDF2 "key" containing the password
		let baseKey;
		try {
			baseKey = await importRawKey(toArrayBuffer(password));
		} catch (error) {
			return this.error('Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await deriveKey(toArrayBuffer(Meteor.userId()), baseKey);
		} catch (error) {
			return this.error('Error deriving baseKey: ', error);
		}
	}

	async requestPassword() {
		return new Promise((resolve) => {
			const showModal = () => {
				imperativeModal.open({
					component: EnterE2EPasswordModal,
					props: {
						onClose: imperativeModal.close,
						onCancel: () => {
							failedToDecodeKey = false;
							this.closeAlert();
							imperativeModal.close();
						},
						onConfirm: (password) => {
							resolve(password);
							this.closeAlert();
							imperativeModal.close();
						},
					},
				});
			};

			const showAlert = () => {
				this.openAlert({
					title: TAPi18n.__('Enter_your_E2E_password'),
					html: TAPi18n.__('Click_here_to_enter_your_encryption_password'),
					modifiers: ['large'],
					closable: false,
					icon: 'key',
					action() {
						showModal();
					},
				});
			};

			if (failedToDecodeKey) {
				showModal();
			} else {
				showAlert();
			}
		});
	}

	async decodePrivateKey(private_key) {
		const password = await this.requestPassword();

		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(private_key));

		try {
			const privKey = await decryptAES(vector, masterKey, cipherText);
			return toString(privKey);
		} catch (error) {
			throw new Error('E2E -> Error decrypting private key');
		}
	}

	async decryptMessage(message) {
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const data = await e2eRoom.decrypt(message.msg);

		if (!data) {
			return message;
		}

		return {
			...message,
			msg: data.text,
			e2e: 'done',
		};
	}

	async decryptPendingMessages() {
		return Messages.find({ t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.direct.update({ _id }, await this.decryptMessage(msg));
		});
	}

	async decryptSubscription(rid) {
		const e2eRoom = await this.getInstanceByRoomId(rid);
		this.log('decryptSubscription ->', rid);
		e2eRoom?.decryptSubscription();
	}

	async decryptSubscriptions() {
		Subscriptions.find({
			encrypted: true,
		}).forEach((room) => this.decryptSubscription(room._id));
	}

	openAlert(config) {
		banners.open({ id: 'e2e', ...config });
	}

	closeAlert() {
		banners.closeById('e2e');
	}
}

export const e2e = new E2E();
