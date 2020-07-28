import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { E2ERoom } from './rocketchat.e2e.room';
import {
	Deferred,
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
} from './helper';
import { Rooms, Subscriptions, Messages } from '../../models';
import { promises } from '../../promises/client';
import { settings } from '../../settings';
import { Notifications } from '../../notifications';
import { Layout, call, modal, alerts } from '../../ui-utils';

import './events.js';
import './tabbar';

let failedToDecodeKey = false;
let showingE2EAlert = false;

class E2E {
	constructor() {
		this.started = false;
		this.enabled = new ReactiveVar(false);
		this._ready = new ReactiveVar(false);
		this.instancesByRoomId = {};
		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			this._ready.set(true);
		});
	}

	isEnabled() {
		return this.enabled.get();
	}

	isReady() {
		return this.enabled.get() && this._ready.get();
	}

	async ready() {
		return this.readyPromise;
	}

	async getInstanceByRoomId(roomId) {
		if (!this.enabled.get()) {
			return;
		}

		const room = Rooms.findOne({
			_id: roomId,
		});

		if (!room) {
			return;
		}

		if (room.encrypted !== true && room.e2eKeyId == null) {
			return;
		}

		if (!this.instancesByRoomId[roomId]) {
			const subscription = Subscriptions.findOne({
				rid: roomId,
			});

			if (!subscription || (subscription.t !== 'd' && subscription.t !== 'p')) {
				return;
			}

			this.instancesByRoomId[roomId] = new E2ERoom(Meteor.userId(), roomId, subscription.t);
		}

		const e2eRoom = this.instancesByRoomId[roomId];

		await this.ready();

		if (e2eRoom) {
			await e2eRoom.handshake();
			return e2eRoom;
		}
	}

	async startClient() {
		if (this.started) {
			return;
		}

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
					title: TAPi18n.__('Wasn\'t possible to decode your encryption key to be imported.'),
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
				private_key: await this.encodePrivateKey(Meteor._localStorage.getItem('private_key'), this.createRandomPassword()),
			});
		}

		const randomPassword = Meteor._localStorage.getItem('e2e.randomPassword');
		if (randomPassword) {
			const passwordRevealText = TAPi18n.__('E2E_password_reveal_text', {
				postProcess: 'sprintf',
				sprintf: [randomPassword],
			});

			this.openAlert({
				title: TAPi18n.__('Save_your_encryption_password'),
				html: TAPi18n.__('Click_here_to_view_and_copy_your_password'),
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action: () => {
					modal.open({
						title: TAPi18n.__('Save_your_encryption_password'),
						html: true,
						text: `<div>${ passwordRevealText }</div>`,
						showConfirmButton: true,
						showCancelButton: true,
						confirmButtonText: TAPi18n.__('I_saved_my_password_close_this_message'),
						cancelButtonText: TAPi18n.__('I_ll_do_it_later'),
					}, (confirm) => {
						if (!confirm) {
							return;
						}
						Meteor._localStorage.removeItem('e2e.randomPassword');
						this.closeAlert();
					});
				},
			});
		}

		this.readyPromise.resolve();

		this.setupListeners();

		this.decryptPendingMessages();
		this.decryptPendingSubscriptions();
	}

	async stopClient() {
		console.log('E2E -> Stop Client');
		// This flag is used to avoid closing unrelated alerts.
		if (showingE2EAlert) {
			alerts.close();
		}

		Meteor._localStorage.removeItem('public_key');
		Meteor._localStorage.removeItem('private_key');
		this.instancesByRoomId = {};
		this.privateKey = null;
		this.enabled.set(false);
		this._ready.set(false);
		this.started = false;

		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			this._ready.set(true);
		});
	}

	setupListeners() {
		Notifications.onUser('e2ekeyRequest', async (roomId, keyId) => {
			const e2eRoom = await this.getInstanceByRoomId(roomId);
			if (!e2eRoom) {
				return;
			}

			e2eRoom.provideKeyToUser(keyId);
		});

		Subscriptions.after.update((userId, doc) => {
			this.decryptSubscription(doc);
		});

		Subscriptions.after.insert((userId, doc) => {
			this.decryptSubscription(doc);
		});

		promises.add('onClientMessageReceived', (msg) => this.decryptMessage(msg), promises.priority.HIGH);
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
			return console.error('E2E -> Error fetching RSA keys: ', error);
		}
	}

	async loadKeys({ public_key, private_key }) {
		Meteor._localStorage.setItem('public_key', public_key);

		try {
			this.privateKey = await importRSAKey(EJSON.parse(private_key), ['decrypt']);

			Meteor._localStorage.setItem('private_key', private_key);
		} catch (error) {
			return console.error('E2E -> Error importing private key: ', error);
		}
	}

	async createAndLoadKeys() {
		// Could not obtain public-private keypair from server.
		let key;
		try {
			key = await generateRSAKey();
			this.privateKey = key.privateKey;
		} catch (error) {
			return console.error('E2E -> Error generating key: ', error);
		}

		try {
			const publicKey = await exportJWKKey(key.publicKey);

			Meteor._localStorage.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			return console.error('E2E -> Error exporting public key: ', error);
		}

		try {
			const privateKey = await exportJWKKey(key.privateKey);

			Meteor._localStorage.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			return console.error('E2E -> Error exporting private key: ', error);
		}

		this.requestSubscriptionKeys();
	}

	async requestSubscriptionKeys() {
		call('e2e.requestSubscriptionKeys');
	}

	createRandomPassword() {
		const randomPassword = `${ Random.id(3) }-${ Random.id(3) }-${ Random.id(3) }`.toLowerCase();
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
			return console.error('E2E -> Error encrypting encodedPrivateKey: ', error);
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
			return console.error('E2E -> Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await deriveKey(toArrayBuffer(Meteor.userId()), baseKey);
		} catch (error) {
			return console.error('E2E -> Error deriving baseKey: ', error);
		}
	}

	async requestPassword() {
		return new Promise((resolve) => {
			let showAlert;

			const showModal = () => {
				modal.open({
					title: TAPi18n.__('Enter_E2E_password_to_decode_your_key'),
					type: 'input',
					inputType: 'password',
					html: true,
					text: `<div>${ TAPi18n.__('E2E_password_request_text') }</div>`,
					showConfirmButton: true,
					showCancelButton: true,
					confirmButtonText: TAPi18n.__('Decode_Key'),
					cancelButtonText: TAPi18n.__('I_ll_do_it_later'),
				}, (password) => {
					if (password) {
						this.closeAlert();
						resolve(password);
					}
				}, () => {
					failedToDecodeKey = false;
					showAlert();
				});
			};

			showAlert = () => {
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
		if (!this.isEnabled()) {
			return message;
		}

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
		if (!this.isEnabled()) {
			return;
		}

		return Messages.find({ t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.direct.update({ _id }, await this.decryptMessage(msg));
		});
	}

	async decryptSubscription(subscription) {
		if (!this.isEnabled()) {
			return;
		}

		if (!subscription.lastMessage || subscription.lastMessage.t !== 'e2e' || subscription.lastMessage.e2e === 'done') {
			return;
		}

		const e2eRoom = await this.getInstanceByRoomId(subscription.rid);

		if (!e2eRoom) {
			return;
		}

		const data = await e2eRoom.decrypt(subscription.lastMessage.msg);
		if (!data) {
			return;
		}

		Subscriptions.direct.update({
			_id: subscription._id,
		}, {
			$set: {
				'lastMessage.msg': data.text,
				'lastMessage.e2e': 'done',
			},
		});
	}

	async decryptPendingSubscriptions() {
		Subscriptions.find({
			'lastMessage.t': 'e2e',
			'lastMessage.e2e': {
				$ne: 'done',
			},
		}).forEach(this.decryptSubscription.bind(this));
	}

	openAlert(config) {
		showingE2EAlert = true;
		alerts.open(config);
	}

	closeAlert() {
		showingE2EAlert = false;
		alerts.close();
	}
}

export const e2e = new E2E();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			const adminEmbedded = Layout.isEmbedded() && FlowRouter.current().path.startsWith('/admin');

			if (!adminEmbedded && settings.get('E2E_Enable') && window.crypto) {
				e2e.startClient();
				e2e.enabled.set(true);
			} else {
				e2e.enabled.set(false);
				e2e.closeAlert();
			}
		}
	});

	// Encrypt messages before sending
	promises.add('onClientBeforeSendMessage', async function(message) {
		if (!message.rid) {
			return Promise.resolve(message);
		}

		const room = Rooms.findOne({
			_id: message.rid,
		});

		if (!room || room.encrypted !== true) {
			return Promise.resolve(message);
		}

		const e2eRoom = await e2e.getInstanceByRoomId(message.rid);
		if (!e2eRoom) {
			return Promise.resolve(message);
		}

		// Should encrypt this message.
		return e2eRoom
			.encrypt(message)
			.then((msg) => {
				message.msg = msg;
				message.t = 'e2e';
				message.e2e = 'pending';
				return message;
			});
	}, promises.priority.HIGH);
});
