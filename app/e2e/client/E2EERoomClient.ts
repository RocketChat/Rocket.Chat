/* eslint-disable no-empty-function */
import { Emitter } from '@rocket.chat/emitter';
import { Base64 } from 'meteor/base64';
import { EJSON } from 'meteor/ejson';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Tracker } from 'meteor/tracker';

import { IMessage } from '../../../definition/IMessage';
import { checkSignal, decryptAES, encryptAES, joinVectorAndEncryptedData, splitVectorAndEncryptedData } from './helpers';
import { IRoom } from '../../../definition/IRoom';
import { Rooms, Subscriptions } from '../../models/client';
import { ISubscription } from '../../../definition/ISubscription';
import { RoomSettingsEnum, roomTypes } from '../../utils/client';

type EncryptableMessage = {
	_id: IMessage['_id'];
	text: IMessage['msg'];
	userId: IMessage['u']['_id'];
	ts: Date;
};

const isEncryptableMessage = (x: EJSONableProperty): x is EncryptableMessage =>
	typeof x === 'object' && x !== null && 'text' in x;

interface IE2EECipher {
	encrypt(input: EncryptableMessage, signal?: AbortSignal): Promise<string>;
	decrypt(input: string, signal?: AbortSignal): Promise<EncryptableMessage>;
}

interface ICryptoKeyHolder {
	readonly keyID: string;

	readonly groupSessionKey: CryptoKey;
}

class E2EECipher implements IE2EECipher {
	constructor(private cryptoKeyHolder: ICryptoKeyHolder) {}

	private isDecryptable(input: string): boolean {
		const keyID = input.slice(0, 12);

		return keyID === this.cryptoKeyHolder.keyID;
	}

	async encrypt(input: EncryptableMessage, signal?: AbortSignal): Promise<string> {
		checkSignal(signal);

		const data = new TextEncoder().encode(EJSON.stringify(input));

		const vector = crypto.getRandomValues(new Uint8Array(16));
		const result = await encryptAES(vector, this.cryptoKeyHolder.groupSessionKey, data);

		checkSignal(signal);

		return this.cryptoKeyHolder.keyID + Base64.encode(joinVectorAndEncryptedData(vector, result));
	}

	async decrypt(input: string, signal?: AbortSignal): Promise<EncryptableMessage> {
		checkSignal(signal);

		if (!this.isDecryptable(input)) {
			throw new Error('input is not decryptable');
		}

		const encryptedText = input.slice(12);

		const [vector, cipherText] = splitVectorAndEncryptedData(Base64.decode(encryptedText));

		const result = await decryptAES(vector, this.cryptoKeyHolder.groupSessionKey, cipherText);

		checkSignal(signal);

		const decryptedText = new TextDecoder().decode(new Uint8Array(result));

		const parsed = EJSON.parse(decryptedText);

		if (!isEncryptableMessage(parsed)) {
			throw new Error('unknown decrypted message format');
		}

		return parsed;
	}
}

export abstract class E2EERoomClient extends Emitter implements ICryptoKeyHolder {
	keyID: string;

	groupSessionKey: CryptoKey;

	userId: string;

	private cipher: IE2EECipher = new E2EECipher(this);

	abstract isReady(): boolean;

	abstract isPaused(): boolean;

	abstract isSupportedRoomType(t: IRoom['t']): boolean;

	private cipherEnabled = false;

	private isCipherEnabledFor(subscription: ISubscription | undefined, room: IRoom | undefined): boolean {
		if (!subscription || !room) {
			return false;
		}

		if (!roomTypes.getConfig(room.t).allowRoomSettingChange({}, RoomSettingsEnum.E2E)) {
			return false;
		}

		if (!subscription.encrypted && !subscription.E2EKey) {
			return false;
		}

		if (!room.encrypted && !room.e2eKeyId) {
			return false;
		}

		return true;
	}

	get decryptionActive(): boolean {
		return this.cipherEnabled && this.isReady();
	}

	get encryptionActive(): boolean {
		return this.cipherEnabled && this.isReady() && !this.isPaused();
	}

	constructor(rid: IRoom['_id']) {
		super();

		const computation = Tracker.autorun(() => {
			const subscription = Subscriptions.findOne({ rid });
			const room = Rooms.findOne({ _id: rid });

			this.cipherEnabled = this.isCipherEnabledFor(subscription, room);
			this.emit('updated');
		});

		this.once('released', () => {
			this.cipherEnabled = false;
			computation.stop();
		});
	}

	async whenCipherEnabled(): Promise<void> {
		if (this.cipherEnabled) {
			return;
		}

		return new Promise((resolve) => {
			const detach = this.on('updated', () => {
				if (this.cipherEnabled) {
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
		if (!this.decryptionActive) {
			return message;
		}

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
		if (!this.encryptionActive) {
			return message;
		}

		const tsServerOffset = TimeSync.serverOffset();
		const ts = new Date(Date.now() + (isNaN(tsServerOffset) ? 0 : tsServerOffset));

		const { signal, release } = this.createAbortSignal(() => !this.encryptionActive);

		const msg = await this.cipher.encrypt({
			_id: message._id,
			text: message.msg,
			userId: this.userId,
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
