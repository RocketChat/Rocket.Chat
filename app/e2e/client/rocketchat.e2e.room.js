import { Base64 } from 'meteor/base64';
import { Session } from 'meteor/session';

import { e2e } from './rocketchat.e2e';
import {
	toString,
	toArrayBuffer,
	encryptRSA,
	decryptRSA,
	generateAESKey,
	exportJWKKey,
	importAESKey,
	importRSAKey,
} from './helpers';
import { Notifications } from '../../notifications/client';
import { Rooms, Subscriptions, Messages } from '../../models/client';
import { roomTypes, RoomSettingsEnum, APIClient } from '../../utils/client';
import { E2EERoomState } from './E2EERoomState';
import { E2EERoomClient } from './E2EERoomClient';

const PAUSED = Symbol('PAUSED');

const permitedMutations = {
	[E2EERoomState.NOT_STARTED]: [
		E2EERoomState.ESTABLISHING,
		E2EERoomState.DISABLED,
		E2EERoomState.KEYS_RECEIVED,
	],
	[E2EERoomState.READY]: [
		E2EERoomState.DISABLED,
	],
	[E2EERoomState.ERROR]: [
		E2EERoomState.KEYS_RECEIVED,
		E2EERoomState.NOT_STARTED,
	],
	[E2EERoomState.WAITING_KEYS]: [
		E2EERoomState.KEYS_RECEIVED,
		E2EERoomState.ERROR,
		E2EERoomState.DISABLED,
	],
	[E2EERoomState.ESTABLISHING]: [
		E2EERoomState.READY,
		E2EERoomState.KEYS_RECEIVED,
		E2EERoomState.ERROR,
		E2EERoomState.DISABLED,
		E2EERoomState.WAITING_KEYS,
	],
};

const filterMutation = (currentState, nextState) => {
	if (currentState === nextState) {
		return nextState === E2EERoomState.ERROR;
	}

	if (!(currentState in permitedMutations)) {
		return nextState;
	}

	if (permitedMutations[currentState].includes(nextState)) {
		return nextState;
	}

	return false;
};

export class E2ERoom extends E2EERoomClient {
	state = undefined;

	[PAUSED] = undefined;

	constructor(userId, roomId) {
		super(roomId);

		this.userId = userId;
		this.roomId = roomId;

		this.once(E2EERoomState.READY, () => this.decryptPendingMessages());
		this.once(E2EERoomState.READY, () => this.decryptSubscription());
		this.on('STATE_CHANGED', (prev) => {
			if (this.roomId === Session.get('openedRoom')) {
				this.log(`[PREV: ${ prev }]`, 'State CHANGED');
			}
		});
		this.on('STATE_CHANGED', () => this.handshake());

		this.setState(E2EERoomState.NOT_STARTED);
	}

	log(...msg) {
		console.log(`E2E ROOM { state: ${ this.state }, rid: ${ this.roomId } }`, ...msg);
	}

	error(...msg) {
		console.error(`E2E ROOM { state: ${ this.state }, rid: ${ this.roomId } }`, ...msg);
	}

	setState(requestedState) {
		const currentState = this.state;
		const nextState = filterMutation(currentState, requestedState);

		if (!nextState) {
			this.error(`invalid state ${ currentState } -> ${ requestedState }`);
			return;
		}

		this.state = nextState;
		this.log(currentState, '->', nextState);
		this.emit('STATE_CHANGED', currentState, nextState, this);
		this.emit(nextState, this);
	}

	isReady() {
		return this.state === E2EERoomState.READY;
	}

	isPaused() {
		return this[PAUSED];
	}

	isDisabled() {
		return this.state === E2EERoomState.DISABLED;
	}

	enable() {
		if (this.state === E2EERoomState.READY) {
			return;
		}

		this.setState(E2EERoomState.READY);
	}

	disable() {
		this.setState(E2EERoomState.DISABLED);
	}

	pause() {
		this.log('PAUSED', this[PAUSED], '->', true);
		this[PAUSED] = true;
		this.emit('PAUSED', true);
	}

	resume() {
		this.log('PAUSED', this[PAUSED], '->', false);
		this[PAUSED] = false;
		this.emit('PAUSED', false);
	}

	keyReceived() {
		this.setState(E2EERoomState.KEYS_RECEIVED);
	}

	async shouldConvertSentMessages() {
		if (!this.isReady() || this[PAUSED]) {
			return false;
		}

		if (this[PAUSED] === undefined) {
			return new Promise((resolve) => {
				this.once('PAUSED', resolve);
			});
		}

		return true;
	}

	shouldConvertReceivedMessages() {
		return this.decryptionActive;
	}

	isWaitingKeys() {
		return this.state === E2EERoomState.WAITING_KEYS;
	}

	async decryptSubscription() {
		const subscription = Subscriptions.findOne({ rid: this.roomId });

		if (!subscription.lastMessage) {
			return;
		}

		const lastMessage = await this.decryptMessage(subscription.lastMessage);

		Subscriptions.direct.update({
			_id: subscription._id,
		}, {
			$set: {
				'lastMessage.msg': lastMessage.msg,
				'lastMessage.e2e': lastMessage.e2e,
			},
		});
		this.log('decryptSubscriptions Done');
	}

	async decryptPendingMessages() {
		return Messages.find({ rid: this.roomId, t: 'e2e', e2e: 'pending' }).forEach(async ({ _id, ...msg }) => {
			Messages.direct.update({ _id }, await this.decryptMessage(msg));
		});
	}

	// Initiates E2E Encryption
	async handshake() {
		await this.whenMetadataSet();

		if (this.state !== E2EERoomState.KEYS_RECEIVED && this.state !== E2EERoomState.NOT_STARTED) {
			return;
		}

		this.setState(E2EERoomState.ESTABLISHING);

		try {
			const groupKey = Subscriptions.findOne({ rid: this.roomId }).E2EKey;
			if (groupKey) {
				await this.importGroupKey(groupKey);
				this.setState(E2EERoomState.READY);
				return;
			}
		} catch (error) {
			this.setState(E2EERoomState.ERROR);
			this.error('Error fetching group key: ', error);
			return;
		}

		try {
			const room = Rooms.findOne({ _id: this.roomId });
			if (!room.e2eKeyId) { // TODO CHECK_PERMISSION
				this.setState(E2EERoomState.CREATING_KEYS);
				await this.createGroupKey();
				this.setState(E2EERoomState.READY);
				return;
			}

			this.setState(E2EERoomState.WAITING_KEYS);
			this.log('Requesting room key');
			Notifications.notifyUsersOfRoom(this.roomId, 'e2e.keyRequest', this.roomId, room.e2eKeyId);
		} catch (error) {
			// this.error = error;
			this.setState(E2EERoomState.ERROR);
		}
	}

	isSupportedRoomType(type) {
		return roomTypes.getConfig(type).allowRoomSettingChange({}, RoomSettingsEnum.E2E);
	}

	async importGroupKey(groupKey) {
		this.log('Importing room key ->', this.roomId);
		// Get existing group key
		// const keyID = groupKey.slice(0, 12);
		groupKey = groupKey.slice(12);
		groupKey = Base64.decode(groupKey);

		// Decrypt obtained encrypted session key
		try {
			const decryptedKey = await decryptRSA(e2e.privateKey, groupKey);
			this.sessionKeyExportedString = toString(decryptedKey);
		} catch (error) {
			return this.error('Error decrypting group key: ', error);
		}

		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		// Import session key for use.
		try {
			const key = await importAESKey(JSON.parse(this.sessionKeyExportedString));
			// Key has been obtained. E2E is now in session.
			this.groupSessionKey = key;
		} catch (error) {
			return this.error('Error importing group key: ', error);
		}
	}

	async createGroupKey() {
		this.log('Creating room key');
		// Create group key
		try {
			this.groupSessionKey = await generateAESKey();
		} catch (error) {
			console.error('Error generating group key: ', error);
			throw error;
		}

		try {
			const sessionKeyExported = await exportJWKKey(this.groupSessionKey);
			this.sessionKeyExportedString = JSON.stringify(sessionKeyExported);
			this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

			await APIClient.v1.post('e2e.setRoomKeyID', { rid: this.roomId, keyID: this.keyID });
			await this.encryptKeyForOtherParticipants();
		} catch (error) {
			this.error('Error exporting group key: ', error);
			throw error;
		}
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const { users } = await APIClient.v1.get('e2e.getUsersOfRoomWithoutKey', { rid: this.roomId });
			users.forEach((user) => this.encryptForParticipant(user));
		} catch (error) {
			return this.error('Error getting room users: ', error);
		}
	}

	async encryptForParticipant(user) {
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(user.e2e.public_key), ['encrypt']);
		} catch (error) {
			return this.error('Error importing user key: ', error);
		}
		// const vector = crypto.getRandomValues(new Uint8Array(16));

		// Encrypt session key for this user with his/her public key
		try {
			const encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			// Key has been encrypted. Publish to that user's subscription model for this room.
			await APIClient.v1.post('e2e.updateGroupKey', {
				rid: this.roomId,
				uid: user._id,
				key: this.keyID + Base64.encode(new Uint8Array(encryptedUserKey)),
			});
		} catch (error) {
			return this.error('Error encrypting user key: ', error);
		}
	}

	provideKeyToUser(keyId) {
		if (this.keyID !== keyId) {
			return;
		}

		this.encryptKeyForOtherParticipants();
	}
}
