/* globals alerts, modal */

import './stylesheets/e2e';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';

import { RocketChat, call } from 'meteor/rocketchat:lib';
import { TAPi18n } from 'meteor/tap:i18n';
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
} from './helper';

class E2E {
	constructor() {
		this.started = false;
		this.enabled = new ReactiveVar(false);
		this.instancesByRoomId = {};
		this.ready = new ReactiveVar(false);
	}

	isEnabled() {
		return this.enabled.get();
	}

	isReady() {
		return this.ready.get();
	}

	getInstanceByRoomId(roomId) {
		if (!this.enabled.get()) {
			return;
		}

		const room = RocketChat.models.Rooms.findOne({
			_id: roomId,
		});

		if (room.encrypted !== true) {
			return;
		}

		if (this.instancesByRoomId[roomId]) {
			return this.instancesByRoomId[roomId];
		}

		const subscription = RocketChat.models.Subscriptions.findOne({
			rid: roomId,
		});

		if (!subscription || (subscription.t !== 'd' && subscription.t !== 'p')) {
			return;
		}

		this.instancesByRoomId[roomId] = new E2ERoom(Meteor.userId(), roomId, subscription.t);
		return this.instancesByRoomId[roomId];
	}

	async startClient() {
		if (this.started) {
			return;
		}

		this.started = true;
		let public_key = localStorage.getItem('public_key');
		let private_key = localStorage.getItem('private_key');

		await this.loadKeysFromDB();

		if (!public_key && this.db_public_key) {
			public_key = this.db_public_key;
		}

		if (!private_key && this.db_private_key) {
			private_key = await this.decodePrivateKey(this.db_private_key);
		}

		if (public_key && private_key) {
			await this.loadKeys({ public_key, private_key });
		} else {
			await this.createAndLoadKeys();
		}

		// TODO: Split in 2 methods to persist keys
		if (!this.db_public_key || !this.db_private_key) {
			await call('addKeyToChain', {
				public_key: localStorage.getItem('public_key'),
				private_key: await this.encodePrivateKey(localStorage.getItem('private_key')),
			});
		}

		const randomPassword = localStorage.getItem('e2e.randomPassword');
		if (randomPassword) {
			alerts.open({
				title: TAPi18n.__('Save your encryption password'),
				html: `<div><span style="font-weight: bold;">${ randomPassword }</span><br/>This password will show up only this time. Click here to know more about it.</div>`,
				modifiers: ['large'],
				closable: false,
				icon: 'key',
				action() {
					modal.open({
						title: TAPi18n.__('Save your encryption password'),
						html: true,
						text: `
							<div>
								Now you can create encrypted private groups or change your direct messages to be encrypted. This is a end to end encryption so the key to encode/decode your messages will not be saved in our savers, for that reason you need to save this password to be able to transfer your key from this client to your mobile phone or to another browser.
								<br/>
								<br/>
								Your password is: <span style="font-weight: bold;">${ randomPassword }</span>
								<br/>
								<br/>
								This is a auto generated password and you can setup a new password for your encryption key any time from any browser that already did receive your key.
								<br/>
								This password is stored on this browser only while you don't copy it and click to dismiss this message.
							</div>
						`,
						showConfirmButton: true,
						showCancelButton: true,
						confirmButtonText: TAPi18n.__('I saved my password, close this message'),
						cancelButtonText: TAPi18n.__('I\'ll do it later'),
					}, (confirm) => {
						if (!confirm) {
							return;
						}
						localStorage.removeItem('e2e.randomPassword');
						alerts.close();
					});
				},
			});
		}

		this.ready.set(true);
	}

	async loadKeysFromDB() {
		try {
			const { public_key, private_key } = await call('fetchMyKeys');
			this.db_public_key = public_key;
			this.db_private_key = private_key;
		} catch (error) {
			return console.error('E2E -> Error fetching RSA keys: ', error);
		}
	}

	async loadKeys({ public_key, private_key }) {
		localStorage.setItem('public_key', public_key);

		try {
			this.privateKey = await importRSAKey(EJSON.parse(private_key), ['decrypt']);

			localStorage.setItem('private_key', private_key);
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

			localStorage.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			return console.error('E2E -> Error exporting public key: ', error);
		}

		try {
			const privateKey = await exportJWKKey(key.privateKey);

			localStorage.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			return console.error('E2E -> Error exporting private key: ', error);
		}
	}

	async encodePrivateKey(private_key) {
		const randomPassword = `${ Random.id(3) }-${ Random.id(3) }-${ Random.id(3) }`.toLowerCase();
		localStorage.setItem('e2e.randomPassword', randomPassword);

		const masterKey = await this.getMasterKey(randomPassword);

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

	async decodePrivateKey(private_key) {
		const password = window.prompt('Enter E2E password to decode your key');

		const masterKey = await this.getMasterKey(password);

		const [vector, cipherText] = splitVectorAndEcryptedData(EJSON.parse(private_key));

		try {
			const privKey = await decryptAES(vector, masterKey, cipherText);
			return toString(privKey);
		} catch (error) {
			return console.error('E2E -> Error decrypting private key: ', error);
		}
	}
}

export const e2e = new E2E();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			if (RocketChat.settings.get('E2E_Enable') && window.crypto) {
				e2e.startClient();
				e2e.enabled.set(true);
			} else {
				e2e.enabled.set(false);
			}
		}
	});

	// Encrypt messages before sending
	RocketChat.promises.add('onClientBeforeSendMessage', function(message) {
		if (!message.rid) {
			return Promise.resolve(message);
		}

		const e2eRoom = e2e.getInstanceByRoomId(message.rid);
		if (!e2eRoom || !e2eRoom.established.get()) {
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
	}, RocketChat.promises.priority.HIGH);
});

