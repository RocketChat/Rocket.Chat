import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import GenericModal from '../../../client/components/GenericModal';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { Presence } from '../../../client/lib/presence';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { getUidDirectMessage } from '../../../client/lib/utils/getUidDirectMessage';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { IMessage } from '../../../definition/IMessage';
import { IOnUserStreamData, IOTRAlgorithm, IOTRDecrypt, IOTRRoom, userPresenceUsername } from '../../../definition/IOTR';
import { Notifications } from '../../notifications/client';
import { otrSystemMessages } from '../lib/constants';
import {
	generateKeyPair,
	exportKey,
	importKey,
	deriveBits,
	digest,
	importKeyRaw,
	encryptAES,
	joinEncryptedData,
	decryptAES,
} from './OTRFunctions';

export class OTRRoom implements IOTRRoom {
	private _userId: string;

	private _roomId: string;

	private _keyPair: CryptoKeyPair | null;

	private _exportedPublicKey: JsonWebKey | null;

	private _sessionKey: CryptoKey | null;

	peerId: string;

	established: ReactiveVar<boolean>;

	establishing: ReactiveVar<boolean>;

	declined: ReactiveVar<boolean>;

	isFirstOTR: boolean;

	constructor(userId: string, roomId: string) {
		this._userId = userId;
		this._roomId = roomId;
		this._keyPair = null;
		this._exportedPublicKey = null;
		this._sessionKey = null;
		this.peerId = getUidDirectMessage(roomId) as string;
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);
		this.isFirstOTR = true;
	}

	async handshake(refresh?: boolean): Promise<void> {
		this.establishing.set(true);
		try {
			await this.generateKeyPair();
			this.peerId &&
				Notifications.notifyUser(this.peerId, 'otr', 'handshake', {
					roomId: this._roomId,
					userId: this._userId,
					publicKey: EJSON.stringify(this._exportedPublicKey),
					refresh,
				});
			if (refresh) {
				Meteor.call('sendSystemMessages', this._roomId, Meteor.user(), otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH);
				this.isFirstOTR = false;
			}
		} catch (e) {
			throw e;
		}
	}

	acknowledge(): void {
		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', {
				roomId: this._roomId,
				userId: this._userId,
				publicKey: EJSON.stringify(this._exportedPublicKey),
			});
	}

	deny(): void {
		this.reset();
		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'deny', {
				roomId: this._roomId,
				userId: this._userId,
			});
	}

	end(): void {
		this.isFirstOTR = true;
		this.reset();
		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'end', {
				roomId: this._roomId,
				userId: this._userId,
			});
	}

	reset(): void {
		this.establishing.set(false);
		this.established.set(false);
		this._keyPair = null;
		this._exportedPublicKey = null;
		this._sessionKey = null;
		Meteor.call('deleteOldOTRMessages', this._roomId);
	}

	async generateKeyPair(): Promise<void> {
		try {
			// Generate an ephemeral key pair.
			this._keyPair = await generateKeyPair();

			this._exportedPublicKey = await exportKey(this._keyPair.publicKey);

			// Once we have generated new keys, it's safe to delete old messages
			Meteor.call('deleteOldOTRMessages', this._roomId);
		} catch (e) {
			throw e;
		}
	}

	async importPublicKey(publicKey: string): Promise<void> {
		try {
			if (!this._keyPair) throw new Error('No key pair');
			const publicKeyObject: JsonWebKey = EJSON.parse(publicKey);
			const peerPublicKey = await importKey(publicKeyObject);
			const ecdhObj: IOTRAlgorithm = {
				name: 'ECDH',
				namedCurve: 'P-256',
				public: peerPublicKey,
			};
			const bits = await deriveBits({ ecdhObj, _keyPair: this._keyPair });
			const hashedBits = await digest(bits);
			// We truncate the hash to 128 bits.
			const sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
			// Session key available.
			this._sessionKey = await importKeyRaw(sessionKeyData);
		} catch (e) {
			throw e;
		}
	}

	async encryptText(data: string | Uint8Array): Promise<string> {
		if (typeof data === 'string' || !_.isObject(data)) {
			data = new TextEncoder().encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		try {
			if (!this._sessionKey) throw new Error('Session Key not available');

			const iv = crypto.getRandomValues(new Uint8Array(12));
			const encryptedData = await encryptAES({ iv, _sessionKey: this._sessionKey, data });

			const output = joinEncryptedData({ encryptedData, iv });

			return EJSON.stringify(output);
		} catch (e) {
			// dispatchToastMessage({ type: 'error', message: e });
			throw new Meteor.Error('encryption-error', 'Encryption error.');
		}
	}

	async encrypt(message: IMessage): Promise<string> {
		let ts;
		if (isNaN(TimeSync.serverOffset())) {
			ts = new Date();
		} else {
			ts = new Date(Date.now() + TimeSync.serverOffset());
		}
		try {
			const data = new TextEncoder().encode(
				EJSON.stringify({
					_id: message._id,
					text: message.msg,
					userId: this._userId,
					ack: Random.id((Random.fraction() + 1) * 20),
					ts,
				}),
			);
			const enc = await this.encryptText(data);
			return enc;
		} catch (e) {
			throw new Meteor.Error('encryption-error', 'Encryption error.');
		}
	}

	async decrypt(message: string): Promise<IOTRDecrypt | string> {
		try {
			if (!this._sessionKey) throw new Error('Session Key not available.');

			const cipherText: Uint8Array = EJSON.parse(message);
			const data = await decryptAES(cipherText, this._sessionKey);
			const msgDecoded: IOTRDecrypt = EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
			if (msgDecoded && typeof msgDecoded === 'object') {
				return msgDecoded;
			}
			return message;
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: String(e) });
			return message;
		}
	}

	async onUserStream(type: string, data: IOnUserStreamData): Promise<void> {
		switch (type) {
			case 'handshake':
				let timeout = 0;

				const establishConnection = async (): Promise<void> => {
					this.establishing.set(true);
					Meteor.clearTimeout(timeout);

					try {
						await this.generateKeyPair();
						await this.importPublicKey(data.publicKey);
						await goToRoomById(data.roomId);
						Meteor.defer(() => {
							this.established.set(true);
							this.acknowledge();

							if (data.refresh) {
								Meteor.call('sendSystemMessages', this._roomId, Meteor.user(), otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY);
							}
						});
					} catch (e) {
						dispatchToastMessage({ type: 'error', message: String(e) });
						throw new Meteor.Error('establish-connection-error', 'Establish connection error.');
					}
				};

				const closeOrCancelModal = (): void => {
					Meteor.clearTimeout(timeout);
					this.deny();
					imperativeModal.close();
				};

				try {
					const obj = await Presence.get(data.userId);
					if (!obj) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}
					const username = await userPresenceUsername(obj.username);

					if (data.refresh && this.established.get()) {
						this.reset();
						await establishConnection();
					} else {
						if (this.established.get()) {
							this.reset();
						}
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: TAPi18n.__('OTR'),
								children: TAPi18n.__('Username_wants_to_start_otr_Do_you_want_to_accept', {
									username,
								}),
								confirmText: TAPi18n.__('Yes'),
								cancelText: TAPi18n.__('No'),
								onClose: (): void => closeOrCancelModal(),
								onCancel: (): void => closeOrCancelModal(),
								onConfirm: async (): Promise<void> => {
									await establishConnection();
									imperativeModal.close();
								},
							},
						});
					}
					timeout = Meteor.setTimeout(() => {
						this.establishing.set(false);
						imperativeModal.close();
					}, 10000);
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: String(e) });
				}
				break;

			case 'acknowledge':
				try {
					await this.importPublicKey(data.publicKey);
					this.established.set(true);

					if (this.isFirstOTR) {
						Meteor.call('sendSystemMessages', this._roomId, Meteor.user(), otrSystemMessages.USER_JOINED_OTR);
					}
					this.isFirstOTR = false;
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: String(e) });
				}
				break;

			case 'deny':
				try {
					const obj = await Presence.get(this.peerId);
					if (!obj) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}
					const username = await userPresenceUsername(obj.username);
					if (this.establishing.get()) {
						this.reset();
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: TAPi18n.__('OTR'),
								children: TAPi18n.__('Username_denied_the_OTR_session', { username }),
								onClose: imperativeModal.close,
								onConfirm: imperativeModal.close,
							},
						});
					}
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: String(e) });
				}
				break;

			case 'end':
				try {
					const obj = await Presence.get(this.peerId);
					if (!obj) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}
					const username = await userPresenceUsername(obj.username);

					if (this.established.get()) {
						this.reset();
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: TAPi18n.__('OTR'),
								children: TAPi18n.__('Username_ended_the_OTR_session', { username }),
								confirmText: TAPi18n.__('Ok'),
								onClose: imperativeModal.close,
								onConfirm: imperativeModal.close,
							},
						});
					}
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: String(e) });
				}

				break;
		}
	}
}
