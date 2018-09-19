import { call } from 'meteor/rocketchat:lib';

function ab2str(buf) {
	return RocketChat.signalUtils.toString(buf);
}

function str2ab(str) {
	return RocketChat.signalUtils.toArrayBuffer(str);
}

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

		this.instancesByRoomId[roomId] = new RocketChat.E2E.Room(Meteor.userId(), roomId, subscription.t);
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
		try {
			const publicKey = await crypto.subtle.importKey('jwk', EJSON.parse(public_key), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt']);

			localStorage.setItem('public_key', public_key);
			RocketChat.E2EStorage.put('public_key', publicKey);
		} catch (error) {
			return console.error('E2E -> Error importing public key: ', error);
		}

		try {
			const privateKey = await crypto.subtle.importKey('jwk', EJSON.parse(private_key), { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['decrypt']);

			localStorage.setItem('private_key', private_key);
			RocketChat.E2EStorage.put('private_key', privateKey);
		} catch (error) {
			return console.error('E2E -> Error importing private key: ', error);
		}
	}

	async createAndLoadKeys() {
		// Could not obtain public-private keypair from server.
		let key;
		try {
			key = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }, true, ['encrypt', 'decrypt']);
		} catch (error) {
			return console.error('E2E -> Error generating key: ', error);
		}

		try {
			const publicKey = await crypto.subtle.exportKey('jwk', key.publicKey);

			localStorage.setItem('public_key', JSON.stringify(publicKey));
			RocketChat.E2EStorage.put('public_key', key.publicKey);
		} catch (error) {
			return console.error('E2E -> Error exporting public key: ', error);
		}

		try {
			const privateKey = await crypto.subtle.exportKey('jwk', key.privateKey);

			localStorage.setItem('private_key', JSON.stringify(privateKey));
			RocketChat.E2EStorage.put('private_key', key.privateKey);
		} catch (error) {
			return console.error('E2E -> Error exporting private key: ', error);
		}
	}

	async encodePrivateKey(private_key) {
		const masterKey = await this.getMasterKey('Enter E2E password to encode your key');

		const vector = crypto.getRandomValues(new Uint8Array(16));
		try {
			const encodedPrivateKey = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, masterKey, str2ab(private_key));
			const cipherText = new Uint8Array(encodedPrivateKey);
			const output = new Uint8Array(vector.length + cipherText.length);

			output.set(vector, 0);
			output.set(cipherText, vector.length);

			return EJSON.stringify(output);
		} catch (error) {
			return console.error('E2E -> Error encrypting encodedPrivateKey: ', error);
		}
	}

	async getMasterKey(msg) {
		// This is a new device for signal encryption
		const userPassword = window.prompt(msg);

		if (userPassword == null) {
			alert('You should provide a password');
		}

		const iterations = 1000;
		const hash = 'SHA-256';

		// First, create a PBKDF2 "key" containing the password
		let baseKey;
		try {
			baseKey = await window.crypto.subtle.importKey('raw', str2ab(userPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
		} catch (error) {
			return console.error('E2E -> Error creating a key based on user password: ', error);
		}

		// Derive a key from the password
		try {
			return await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: str2ab(Meteor.userId()), iterations, hash }, baseKey, { name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt']);
		} catch (error) {
			console.error('E2E -> Error deriving baseKey: ', error);
			return;
		}
	}

	async decodePrivateKey(private_key) {
		const masterKey = await this.getMasterKey('Enter E2E password to decode your key');
		let cipherText = EJSON.parse(private_key);
		const vector = cipherText.slice(0, 16);
		cipherText = cipherText.slice(16);

		try {
			const privKey = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, masterKey, cipherText);
			return ab2str(privKey);
		} catch (error) {
			return console.error('E2E -> Error decrypting private key: ', error);
		}
	}
}

RocketChat.E2E = new E2E();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			RocketChat.E2E.startClient();
			// TODO: need review
			RocketChat.Notifications.onUser('e2e', (type, data) => {
				if (!data.roomId || !data.userId || data.userId === Meteor.userId()) {
					return;
				} else {
					RocketChat.E2E.getInstanceByRoomId(data.roomId).onUserStream(type, data);
				}
			});
		}
	});

	// Encrypt messages before sending
	RocketChat.promises.add('onClientBeforeSendMessage', function(message) {
		if (!message.rid) {
			return Promise.resolve(message);
		}

		const e2eRoom = RocketChat.E2E.getInstanceByRoomId(message.rid);
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
		if (RocketChat.settings.get('E2E_Enable') && window.crypto) {
			RocketChat.E2E.crypto = window.crypto.subtle || window.crypto.webkitSubtle;
			RocketChat.E2E.enabled.set(true);
		} else {
			RocketChat.E2E.enabled.set(false);
		}
	});
});

