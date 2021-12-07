/* eslint-disable no-empty-function */
import { Emitter } from '@rocket.chat/emitter';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';

import { IMessage } from '../../../definition/IMessage';
import { checkSignal, decryptAES, encryptAES, joinVectorAndEncryptedData, splitVectorAndEncryptedData } from './helpers';
import { IRoom } from '../../../definition/IRoom';
import { Rooms, Subscriptions } from '../../models/client';
import { ISubscription } from '../../../definition/ISubscription';
import { RoomSettingsEnum, roomTypes } from '../../utils/client';
import { IUser } from '../../../definition/IUser';

type EncryptableMessage = {
	_id: IMessage['_id'];
	text: IMessage['msg'];
	userId: IMessage['u']['_id'];
	ts: Date;
};

interface IE2EECipher {
	encrypt(input: EncryptableMessage, signal?: AbortSignal): Promise<string>;
	decrypt(input: string, signal?: AbortSignal): Promise<EncryptableMessage>;
}

interface ICryptoKeyHolder {
	readonly keyID: string;

	readonly key: CryptoKey;
}

class E2EECipher implements IE2EECipher {
	constructor(private cryptoKeyHolder: ICryptoKeyHolder) {}

	async encrypt(input: EncryptableMessage, signal?: AbortSignal): Promise<string> {
		checkSignal(signal);

		const data = new TextEncoder().encode(EJSON.stringify(input));

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const result = await encryptAES(vector, this.cryptoKeyHolder.key, data);

		checkSignal(signal);

		return this.cryptoKeyHolder.keyID + Base64.encode(joinVectorAndEncryptedData(vector, result));
	}

	private isDecryptable(input: string): boolean {
		const keyID = input.slice(0, 12);

		return keyID === this.cryptoKeyHolder.keyID;
	}

	private isEncryptableMessage(x: EJSONableProperty): x is EncryptableMessage {
		return typeof x === 'object' && x !== null && 'text' in x;
	}

	async decrypt(input: string, signal?: AbortSignal): Promise<EncryptableMessage> {
		checkSignal(signal);

		if (!this.isDecryptable(input)) {
			throw new Error('input is not decryptable');
		}

		const encryptedText = input.slice(12);

		const [vector, cipherText] = splitVectorAndEncryptedData(Base64.decode(encryptedText));

		const result = await decryptAES(vector, this.cryptoKeyHolder.key, cipherText);

		checkSignal(signal);

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
	subscription: ISubscription;
	room: IRoom;
};

const getRoomMetadata = (rid: IRoom['_id']): E2EERoomMetadata | undefined => {
	const uid = Meteor.userId();

	if (!uid) {
		return undefined;
	}

	const subscription = Subscriptions.findOne({ rid });
	const room = Rooms.findOne({ _id: rid });

	if (!subscription || !room) {
		return undefined;
	}

	if (!roomTypes.getConfig(room.t).allowRoomSettingChange({}, RoomSettingsEnum.E2E)) {
		return undefined;
	}

	if (!subscription.encrypted && !subscription.E2EKey) {
		return undefined;
	}

	if (!room.encrypted && !room.e2eKeyId) {
		return undefined;
	}

	return {
		uid,
		subscription,
		room,
	};
};

export abstract class E2EERoomClient extends Emitter implements ICryptoKeyHolder {
	keyID: string;

	key: CryptoKey;

	private cipher: IE2EECipher = new E2EECipher(this);

	abstract isReady(): boolean;

	abstract isPaused(): boolean;

	abstract isSupportedRoomType(t: IRoom['t']): boolean;

	abstract resume(): void;

	abstract pause(): void;

	abstract disable(): void;

	abstract isWaitingKeys(): boolean;

	abstract keyReceived(): void;

	abstract decryptSubscription(): void;

	private metadata: E2EERoomMetadata | undefined = undefined;

	get decryptionActive(): boolean {
		return this.metadata !== undefined && this.isReady();
	}

	get encryptionActive(): boolean {
		return this.metadata !== undefined && this.isReady() && !this.isPaused();
	}

	constructor(rid: IRoom['_id']) {
		super();

		this.on('metadataUpdated', () => this.handleMetadataUpdated());

		const computation = Tracker.autorun(() => {
			try {
				this.metadata = getRoomMetadata(rid);
			} finally {
				this.emit('metadataUpdated');
			}
		});

		this.once('released', () => {
			this.metadata = undefined;
			computation.stop();
		});
	}

	release(): void {
		this.emit('released');
	}

	private handleMetadataUpdated(): void {
		if (this.metadata === undefined) {
			return;
		}

		const { subscription } = this.metadata;

		subscription.encrypted ? this.resume() : this.pause();

		// Cover private groups and direct messages
		if (!this.isSupportedRoomType(subscription.t)) {
			this.disable();
			return;
		}

		if (subscription.E2EKey && this.isWaitingKeys()) {
			this.keyReceived();
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
			const detach = this.on('metadataUpdated', () => {
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

	private createAbortSignal(predicate: () => boolean): { signal: AbortSignal; release: () => void } {
		const abortController = new AbortController();

		const eventHandler = (): void => {
			if (!abortController.signal.aborted && predicate()) {
				abortController.abort();
				this.off('STATE_CHANGED', eventHandler);
				this.off('PAUSED', eventHandler);
			}
		};

		this.on('STATE_CHANGED', eventHandler);
		this.on('PAUSED', eventHandler);

		return {
			signal: abortController.signal,
			release: (): void => {
				this.off('STATE_CHANGED', eventHandler);
				this.off('PAUSED', eventHandler);
			},
		};
	}

	async decryptMessage(message: IMessage): Promise<IMessage> {
		// not ready for decryption
		if (!this.decryptionActive) {
			return message;
		}

		// the message is not encrypted / alrready encryted
		if (message.t !== 'e2e' || message.e2e === 'done') {
			return message;
		}

		const { signal, release } = this.createAbortSignal(() => !this.decryptionActive);

		const data = await this.cipher.decrypt(message.msg, signal)
			.catch((reason) => {
				console.error(reason);
				return undefined;
			});

		release();

		// decryption was deactivated or failed
		if (!this.decryptionActive || !data?.text) {
			return message;
		}

		return {
			...message,
			msg: data.text,
			e2e: 'done',
		};
	}

	async encryptMessage(message: IMessage): Promise<IMessage> {
		if (this.metadata === undefined) {
			return message;
		}

		if (!this.encryptionActive) {
			return message;
		}

		if (message.t === 'e2e') {
			// already encrypted
			return message;
		}

		const tsServerOffset = TimeSync.serverOffset();
		const ts = new Date(Date.now() + (isNaN(tsServerOffset) ? 0 : tsServerOffset));

		const { signal, release } = this.createAbortSignal(() => !this.encryptionActive);

		const msg = await this.cipher.encrypt({
			_id: message._id,
			text: message.msg,
			userId: this.metadata.uid,
			ts,
		}, signal)
			.catch((reason) => {
				console.error(reason);
				return undefined;
			});

		release();

		if (!this.encryptionActive || !msg) {
			return message;
		}

		return {
			...message,
			t: 'e2e',
			msg,
			e2e: 'pending',
		};
	}
}
