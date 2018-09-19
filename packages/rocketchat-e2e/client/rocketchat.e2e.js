import './stylesheets/e2e';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';

import { RocketChat, call } from 'meteor/rocketchat:lib';
import { E2ERoom } from './rocketchat.e2e.room';
import { toString, toArrayBuffer } from './helper';

class E2E {
	constructor() {
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
			this.privateKey = await this.importRSAKey(EJSON.parse(private_key), ['decrypt']);

			localStorage.setItem('private_key', private_key);
		} catch (error) {
			return console.error('E2E -> Error importing private key: ', error);
		}
	}

	async createAndLoadKeys() {
		// Could not obtain public-private keypair from server.
		let key;
		try {
			key = await this.generateRSAKey();
			this.privateKey = key.privateKey;
		} catch (error) {
			return console.error('E2E -> Error generating key: ', error);
		}

		try {
			const publicKey = await this.exportJWKKey(key.publicKey);

			localStorage.setItem('public_key', JSON.stringify(publicKey));
		} catch (error) {
			return console.error('E2E -> Error exporting public key: ', error);
		}

		try {
			const privateKey = await this.exportJWKKey(key.privateKey);

			localStorage.setItem('private_key', JSON.stringify(privateKey));
		} catch (error) {
			return console.error('E2E -> Error exporting private key: ', error);
		}
	}

	async encodePrivateKey(private_key) {
		const masterKey = await this.getMasterKey('Enter E2E password to encode your key');

		const vector = crypto.getRandomValues(new Uint8Array(16));
		try {
			const encodedPrivateKey = await this.encryptAES(vector, masterKey, toArrayBuffer(private_key));

			return EJSON.stringify(this.joinVectorAndEcryptedData(vector, encodedPrivateKey));
		} catch (error) {
			return console.error('E2E -> Error encrypting encodedPrivateKey: ', error);
		}
	}

	joinVectorAndEcryptedData(vector, encryptedData) {
		const cipherText = new Uint8Array(encryptedData);
		const output = new Uint8Array(vector.length + cipherText.length);
		output.set(vector, 0);
		output.set(cipherText, vector.length);
		return output;
	}

	splitVectorAndEcryptedData(cipherText) {
		const vector = cipherText.slice(0, 16);
		const encryptedData = cipherText.slice(16);

		return [vector, encryptedData];
	}

	async encryptRSA(key, data) {
		return await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
	}

	async encryptAES(vector, key, data) {
		return await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
	}

	async decryptRSA(key, data) {
		return await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);
	}

	async decryptAES(vector, key, data) {
		return await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, key, data);
	}

	async generateAESKey() {
		return await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
	}

	async generateRSAKey() {
		return await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt', 'decrypt']);
	}

	async exportJWKKey(key) {
		return await crypto.subtle.exportKey('jwk', key);
	}

	async importRSAKey(keyData, keyUsages = ['encrypt', 'decrypt']) {
		return await crypto.subtle.importKey('jwk', keyData, { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, keyUsages);
	}

	async importAESKey(keyData, vector, keyUsages = ['encrypt', 'decrypt']) {
		return await crypto.subtle.importKey('jwk', keyData, { name: 'AES-CBC', iv: vector }, true, keyUsages);
	}

	async importRawKey(keyData, keyUsages = ['deriveKey']) {
		return await crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);
	}

	async deriveKey(salt, baseKey, keyUsages = ['encrypt', 'decrypt']) {
		const iterations = 1000;
		const hash = 'SHA-256';

		return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, baseKey, { name: 'AES-CBC', length: 256 }, true, keyUsages);
	}

	async getMasterKey(msg) {
		// This is a new device for signal encryption
		const userPassword = window.prompt(msg);

		if (userPassword == null) {
			alert('You should provide a password');
		}

		// First, create a PBKDF2 "key" containing the password
		let baseKey;
		try {
			baseKey = await this.importRawKey(toArrayBuffer(userPassword));
		} catch (error) {
			return console.error('E2E -> Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await this.deriveKey(toArrayBuffer(Meteor.userId()), baseKey);
		} catch (error) {
			console.error('E2E -> Error deriving baseKey: ', error);
			return;
		}
	}

	async decodePrivateKey(private_key) {
		const masterKey = await this.getMasterKey('Enter E2E password to decode your key');

		const [vector, cipherText] = this.splitVectorAndEcryptedData(EJSON.parse(private_key));

		try {
			const privKey = await this.decryptAES(vector, masterKey, cipherText);
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
			e2e.startClient();
			// TODO: need review
			RocketChat.Notifications.onUser('e2e', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				} else {
					e2e.getInstanceByRoomId(data.roomId).onUserStream(type, data);
				}
			});
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

	Tracker.autorun(function() {
		e2e.enabled.set(RocketChat.settings.get('E2E_Enable') && window.crypto);
	});
});

