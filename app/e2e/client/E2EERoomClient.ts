/* eslint-disable no-empty-function */
import { Emitter } from '@rocket.chat/emitter';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { IMessage } from '../../../definition/IMessage';
import { decryptAES, decryptRSA, encryptAES, importAESKey, joinVectorAndEncryptedData, splitVectorAndEncryptedData, toString } from './helpers';
import { IRoom } from '../../../definition/IRoom';
import { Rooms, Subscriptions } from '../../models/client';
import { ISubscription } from '../../../definition/ISubscription';
import { RoomSettingsEnum, roomTypes } from '../../utils/client';
import { IUser } from '../../../definition/IUser';
import { E2EERoomState } from './E2EERoomState';
import { isShallowEqual } from '../../../lib/utils/isShallowEqual';

type EncryptableMessage = {
	_id: IMessage['_id'];
	text: IMessage['msg'];
	userId: IMessage['u']['_id'];
	ts: Date;
};

const extractEncryptedKeyId = (encryptedData: string): string => encryptedData.slice(0, 12);

const extractEncryptedBody = (encryptedData: string): Uint8Array => Base64.decode(encryptedData.slice(12));

interface IE2EECipher {
	encrypt(input: EncryptableMessage): Promise<string>;
	decrypt(input: string): Promise<EncryptableMessage>;
}

interface ICryptoKeyHolder {
	readonly keyID: string;

	readonly key: CryptoKey;
}

class E2EECipher implements IE2EECipher {
	constructor(private cryptoKeyHolder: ICryptoKeyHolder) {}

	async encrypt(input: EncryptableMessage): Promise<string> {
		const data = new TextEncoder().encode(EJSON.stringify(input));

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const result = await encryptAES(vector, this.cryptoKeyHolder.key, data);

		return this.cryptoKeyHolder.keyID + Base64.encode(joinVectorAndEncryptedData(vector, result));
	}

	private isDecryptable(input: string): boolean {
		const keyID = extractEncryptedKeyId(input);

		return keyID === this.cryptoKeyHolder.keyID;
	}

	private isEncryptableMessage(x: EJSONableProperty): x is EncryptableMessage {
		return typeof x === 'object' && x !== null && 'text' in x;
	}

	async decrypt(input: string): Promise<EncryptableMessage> {
		if (!this.isDecryptable(input)) {
			throw new Error('input is not decryptable');
		}

		const encrypted = extractEncryptedBody(input);

		const [vector, cipherText] = splitVectorAndEncryptedData(encrypted);

		const result = await decryptAES(vector, this.cryptoKeyHolder.key, cipherText);

		const decryptedText = new TextDecoder().decode(new Uint8Array(result));

		const parsed = EJSON.parse(decryptedText);

		if (!this.isEncryptableMessage(parsed)) {
			throw new Error('unknown decrypted message format');
		}

		return parsed;
	}
}

type E2EERoomMetadata = {
	uid: IUser['_id'];
	encryptionRequired: boolean;
	roomKeyId: IRoom['e2eKeyId'];
	encryptedSubscriptionKey: ISubscription['E2EKey'];
};

interface IE2EERoomMetadataEmitter extends Emitter<{
	metadataEmitted: E2EERoomMetadata | undefined;
}> {
	start(): void;
	stop(): void;
}

class E2EERoomMetadataEmitter extends Emitter<{
	metadataEmitted: E2EERoomMetadata | undefined;
}> implements IE2EERoomMetadataEmitter {
	computation: Tracker.Computation | undefined = undefined;

	constructor(private rid: IRoom['_id']) {
		super();
	}

	private getRoomMetadata(): E2EERoomMetadata | undefined {
		const uid = Meteor.userId();

		if (!uid) {
			return undefined;
		}

		const subscription: ISubscription | undefined = Subscriptions.findOne({ rid: this.rid });
		const room: IRoom | undefined = Rooms.findOne({ _id: this.rid });

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
			roomKeyId: room.e2eKeyId,
			encryptedSubscriptionKey: subscription.E2EKey,
		};
	}

	start(): void {
		if (this.computation) {
			return;
		}

		this.computation = Tracker.autorun(() => {
			const metadata = this.getRoomMetadata();
			this.emit('metadataEmitted', metadata);
		});
	}

	stop(): void {
		this.computation?.stop();
		this.computation = undefined;
	}
}

export abstract class E2EERoomClient extends Emitter implements ICryptoKeyHolder {
	keyID: string;

	key: CryptoKey;

	private cipher: IE2EECipher = new E2EECipher(this);

	abstract decryptSubscription(): void;

	abstract setState(nextState: E2EERoomState): void;

	private metadata: E2EERoomMetadata | undefined = undefined;

	private metadataEmitter: IE2EERoomMetadataEmitter;

	constructor(protected readonly rid: IRoom['_id'], protected readonly userPrivateKey: CryptoKey) {
		super();

		this.metadataEmitter = new E2EERoomMetadataEmitter(rid);

		this.metadataEmitter.on('metadataEmitted', (metadata) => {
			if (isShallowEqual(this.metadata, metadata)) {
				return;
			}

			this.metadata = metadata;
			this.emit('metadataChanged', metadata);
		});

		this.on('metadataChanged', () => this.handleMetadataUpdated());

		this.metadataEmitter.start();
	}

	release(): void {
		this.metadataEmitter.stop();
	}

	state = E2EERoomState.NOT_STARTED;

	isReady(): boolean {
		return this.state === E2EERoomState.READY;
	}

	isDisabled(): boolean {
		return this.state === E2EERoomState.DISABLED;
	}

	isWaitingKeys(): boolean {
		return this.state === E2EERoomState.WAITING_KEYS;
	}

	sessionKeyExportedString: string;

	async decryptSubscriptionKey(encryptedSubscriptionKey: string): Promise<ArrayBuffer> {
		const encryptedBody = extractEncryptedBody(encryptedSubscriptionKey);
		return decryptRSA(this.userPrivateKey, encryptedBody);
	}

	async importSubscriptionKey(encryptedSubscriptionKey: string): Promise<void> {
		try {
			const decryptedSubscriptionKey = await this.decryptSubscriptionKey(encryptedSubscriptionKey);
			const jwkSubscriptionKey: JsonWebKey = JSON.parse(toString(decryptedSubscriptionKey));
			const subscriptionKey = await importAESKey(jwkSubscriptionKey);

			this.key = subscriptionKey;
			this.keyID = Base64.encode(toString(decryptedSubscriptionKey)).slice(0, 12);
			this.sessionKeyExportedString = toString(decryptedSubscriptionKey);
		} catch (error) {
			console.error(error);
		}
	}

	private handleMetadataUpdated(): void {
		this.setState(E2EERoomState.ESTABLISHING);

		if (this.metadata === undefined) {
			this.setState(E2EERoomState.DISABLED);
			return;
		}

		const { encryptedSubscriptionKey } = this.metadata;

		if (encryptedSubscriptionKey && !this.key) {
			this.importSubscriptionKey(encryptedSubscriptionKey)
				.then(() => {
					this.setState(E2EERoomState.READY);
				})
				.catch((error) => {
					console.error(error);
					this.setState(E2EERoomState.ERROR);
				});
			return;
		}

		if (encryptedSubscriptionKey && this.isWaitingKeys()) {
			this.setState(E2EERoomState.KEYS_RECEIVED);
			return;
		}

		if (!this.isReady()) {
			return;
		}

		this.decryptSubscription();
	}

	protected async whenMetadataSet(): Promise<void> {
		if (this.metadata !== undefined) {
			return;
		}

		return new Promise((resolve) => {
			const detach = this.on('metadataChanged', () => {
				if (this.metadata !== undefined) {
					detach();
					resolve();
				}
			});
		});
	}

	async whenReady(): Promise<void> {
		await this.whenMetadataSet();

		if (this.isReady()) {
			return;
		}

		return new Promise((resolve) => {
			const detach = this.on('STATE_CHANGED', () => {
				if (this.isReady()) {
					detach();
					resolve();
				}
			});
		});
	}

	async decryptMessage(message: IMessage): Promise<IMessage> {
		if (this.metadata === undefined) {
			return message;
		}

		if (!this.isReady()) {
			return message;
		}

		// the message is not encrypted / alrready encryted
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		const data = await this.cipher.decrypt(message.msg);

		return {
			...message,
			msg: data.text,
			e2e: 'done',
		};
	}

	private async getMetadata(): Promise<E2EERoomMetadata> {
		if (this.metadata === undefined) {
			await this.whenMetadataSet();
		}

		if (this.metadata === undefined) {
			throw new Error('illegal state');
		}

		return this.metadata;
	}

	async encryptMessage(message: IMessage): Promise<IMessage> {
		const { encryptionRequired, uid } = await this.getMetadata();
		await this.whenReady();

		if (!encryptionRequired) {
			// encryption is not required on room
			return message;
		}

		if (message.t === 'e2e') {
			// already encrypted
			return message;
		}

		const tsServerOffset = TimeSync.serverOffset();
		const ts = new Date(Date.now() + (isNaN(tsServerOffset) ? 0 : tsServerOffset));

		const msg = await this.cipher.encrypt({
			_id: message._id,
			text: message.msg,
			userId: uid,
			ts,
		});

		return {
			...message,
			t: 'e2e',
			msg,
			e2e: 'pending',
		};
	}
}
