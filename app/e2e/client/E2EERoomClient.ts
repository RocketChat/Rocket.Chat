/* eslint-disable no-empty-function */
import { Emitter } from '@rocket.chat/emitter';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { IMessage } from '../../../definition/IMessage';
import { decryptAES, decryptRSA, encryptAES, exportJWKKey, generateAESKey, importAESKey, joinVectorAndEncryptedData, splitVectorAndEncryptedData, toString } from './helpers';
import { IRoom } from '../../../definition/IRoom';
import { Rooms, Subscriptions } from '../../models/client';
import { ISubscription } from '../../../definition/ISubscription';
import { APIClient, RoomSettingsEnum, roomTypes } from '../../utils/client';
import { IUser } from '../../../definition/IUser';
import { isShallowEqual } from '../../../lib/utils/isShallowEqual';
import { Notifications } from '../../notifications/client';

type EncryptableMessage = {
	_id: IMessage['_id'];
	text: IMessage['msg'];
	userId: IMessage['u']['_id'];
	ts: Date;
};

const extractEncryptedKeyId = (encryptedData: string): string => encryptedData.slice(0, 12);

const extractEncryptedBody = (encryptedData: string): Uint8Array => Base64.decode(encryptedData.slice(12));

interface ICipher {
	encrypt(input: EncryptableMessage, key: CryptoKey, keyID: string): Promise<string>;
	decrypt(input: string, key: CryptoKey, keyID: string): Promise<EncryptableMessage>;
}

class Cipher implements ICipher {
	async encrypt(input: EncryptableMessage, key: CryptoKey, keyID: string): Promise<string> {
		const data = new TextEncoder().encode(EJSON.stringify(input));

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const result = await encryptAES(vector, key, data);

		return keyID + Base64.encode(joinVectorAndEncryptedData(vector, result));
	}

	private isEncryptableMessage(x: EJSONableProperty): x is EncryptableMessage {
		return typeof x === 'object' && x !== null && 'text' in x;
	}

	async decrypt(input: string, key: CryptoKey, keyID: string): Promise<EncryptableMessage> {
		if (extractEncryptedKeyId(input) !== keyID) {
			throw new Error('input is not decryptable');
		}

		const encrypted = extractEncryptedBody(input);

		const [vector, cipherText] = splitVectorAndEncryptedData(encrypted);

		const result = await decryptAES(vector, key, cipherText);

		const decryptedText = new TextDecoder().decode(new Uint8Array(result));

		const parsed = EJSON.parse(decryptedText);

		if (!this.isEncryptableMessage(parsed)) {
			throw new Error('unknown decrypted message format');
		}

		return parsed;
	}
}

type RoomMetadata = {
	uid: IUser['_id'];
	encryptionRequired: boolean;
	roomKeyID: IRoom['e2eKeyId'];
	encryptedKey: ISubscription['E2EKey'];
};

const getRoomMetadata = (rid: IRoom['_id']): RoomMetadata | undefined => {
	const uid = Meteor.userId();

	if (!uid) {
		return undefined;
	}

	const subscription: ISubscription | undefined = Subscriptions.findOne({ rid });
	const room: IRoom | undefined = Rooms.findOne({ _id: rid });

	if (!subscription || !room) {
		return undefined;
	}

	if (!roomTypes.getConfig(room.t).allowRoomSettingChange({}, RoomSettingsEnum.E2E)) {
		return undefined;
	}

	if (!room.encrypted && !subscription.E2EKey) {
		return undefined;
	}

	if (!room.encrypted && !room.e2eKeyId) {
		return undefined;
	}

	return {
		uid,
		encryptionRequired: room.encrypted === true,
		roomKeyID: room.e2eKeyId,
		encryptedKey: subscription.E2EKey,
	};
};

export abstract class E2EERoomClient extends Emitter<{
	metadataChanged: void;
	keyChanged: void;
}> {
	private computation: Tracker.Computation | undefined;

	private cipher: ICipher = new Cipher();

	private metadata: RoomMetadata | undefined = undefined;

	key: CryptoKey | undefined;

	keyID: string | undefined;

	sessionKeyExportedString: string | undefined;

	constructor(protected readonly rid: IRoom['_id'], protected readonly userPrivateKey: CryptoKey) {
		super();

		this.on('metadataChanged', () => this.handleMetadataChanged());
		this.on('keyChanged', () => {
			const key = this.getKey();

			if (!key) {
				return;
			}

			this.decryptSubscription();
			this.decryptPendingMessages();
		});
	}

	start(): void {
		this.computation = this.computation ?? Tracker.autorun(() => {
			const metadata = getRoomMetadata(this.rid);

			if (isShallowEqual(this.metadata, metadata)) {
				return;
			}

			this.metadata = metadata;
			this.emit('metadataChanged');
		});
	}

	stop(): void {
		this.computation?.stop();
		this.computation = undefined;
	}

	protected getMetadata(): RoomMetadata | undefined {
		return this.metadata;
	}

	protected async fetchMetadata(): Promise<RoomMetadata> {
		const metadata = this.getMetadata();
		if (metadata !== undefined) {
			return metadata;
		}

		return new Promise((resolve) => {
			const callback = (): void => {
				const metadata = this.getMetadata();

				if (metadata) {
					resolve(metadata);
					return;
				}

				this.once('metadataChanged', callback);
			};

			this.once('metadataChanged', callback);
		});
	}

	protected getKey(): CryptoKey | undefined {
		return this.key;
	}

	protected async fetchKey(): Promise<CryptoKey> {
		const key = this.getKey();

		if (key !== undefined) {
			return key;
		}

		return new Promise((resolve) => {
			const callback = (): void => {
				const key = this.getKey();

				if (key) {
					resolve(key);
					return;
				}

				this.once('keyChanged', callback);
			};

			this.once('keyChanged', callback);
		});
	}

	protected getKeyID(): string | undefined {
		return this.keyID;
	}

	protected async fetchKeyID(): Promise<string> {
		const keyID = this.getKeyID();

		if (keyID !== undefined) {
			return keyID;
		}

		return new Promise((resolve) => {
			const callback = (): void => {
				const keyID = this.getKeyID();

				if (keyID) {
					resolve(keyID);
					return;
				}

				this.once('keyChanged', callback);
			};

			this.once('keyChanged', callback);
		});
	}

	async importSubscriptionKey(encryptedSubscriptionKey: string): Promise<void> {
		const encryptedBody = extractEncryptedBody(encryptedSubscriptionKey);
		const unencryptedSubscriptionKey = toString(await decryptRSA(this.userPrivateKey, encryptedBody));
		const jwkSubscriptionKey: JsonWebKey = JSON.parse(unencryptedSubscriptionKey);
		const subscriptionKey = await importAESKey(jwkSubscriptionKey);

		this.key = subscriptionKey;
		this.keyID = extractEncryptedKeyId(Base64.encode(unencryptedSubscriptionKey));
		this.sessionKeyExportedString = unencryptedSubscriptionKey;
	}

	private discardKey(): void {
		this.key = undefined;
		this.keyID = undefined;
		this.sessionKeyExportedString = undefined;
	}

	private async createGroupKey(): Promise<void> {
		const subscriptionKey = await generateAESKey();
		const jwkSubscriptionKey = await exportJWKKey(subscriptionKey);
		const unencryptedSubscriptionKey = JSON.stringify(jwkSubscriptionKey);

		const key = subscriptionKey;
		const keyID = extractEncryptedKeyId(Base64.encode(unencryptedSubscriptionKey));

		await APIClient.v1.post('e2e.setRoomKeyID', { rid: this.rid, keyID });

		this.key = key;
		this.keyID = keyID;
		this.sessionKeyExportedString = unencryptedSubscriptionKey;

		await this.encryptKeyForOtherParticipants();
	}

	private requestGroupKey(keyID: string): void {
		Notifications.notifyUsersOfRoom(this.rid, 'e2e.keyRequest', this.rid, keyID);
	}

	private handleMetadataChanged(): void {
		const metadata = this.getMetadata();

		if (metadata === undefined) {
			this.discardKey();
			this.emit('keyChanged');
			return;
		}

		const key = this.getKey();
		const keyID = this.getKeyID();
		const { roomKeyID: roomKeyId, encryptedKey: encryptedSubscriptionKey } = metadata;

		if (keyID && key && keyID === roomKeyId) {
			return;
		}

		this.discardKey();
		this.emit('keyChanged');

		if (encryptedSubscriptionKey) {
			this.importSubscriptionKey(encryptedSubscriptionKey)
				.then(() => {
					this.emit('keyChanged');
				})
				.catch((error) => {
					console.error(error);
				});
			return;
		}

		if (!roomKeyId) {
			this.createGroupKey()
				.then(() => {
					this.emit('keyChanged');
				})
				.catch((error) => {
					console.error(error);
				});
			return;
		}

		this.requestGroupKey(roomKeyId);
	}

	abstract decryptSubscription(): void;

	abstract decryptPendingMessages(): void;

	abstract encryptKeyForOtherParticipants(): Promise<void>;

	async decryptMessage(message: IMessage, { waitForKey = false }: { waitForKey?: boolean } = {}): Promise<IMessage> {
		// the message is not encrypted / alrready encryted
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		const key = waitForKey ? await this.fetchKey() : this.getKey();
		const keyID = waitForKey ? await this.fetchKeyID() : this.getKeyID();

		if (!key || !keyID) {
			return message;
		}

		const data = await this.cipher.decrypt(message.msg, key, keyID);

		return {
			...message,
			msg: data.text,
			e2e: 'done',
		};
	}

	async encryptMessage(message: IMessage): Promise<IMessage> {
		const { encryptionRequired, uid } = await this.fetchMetadata();

		if (!encryptionRequired) {
			// encryption is not required on room
			return message;
		}

		if (message.t === 'e2e') {
			// already encrypted
			return message;
		}

		const key = await this.fetchKey();
		const keyID = await this.fetchKeyID();

		const tsServerOffset = TimeSync.serverOffset();
		const ts = new Date(Date.now() + (isNaN(tsServerOffset) ? 0 : tsServerOffset));

		const msg = await this.cipher.encrypt({
			_id: message._id,
			text: message.msg,
			userId: uid,
			ts,
		}, key, keyID);

		return {
			...message,
			t: 'e2e',
			msg,
			e2e: 'pending',
		};
	}
}
