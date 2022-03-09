import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { TimeSync } from 'meteor/mizzao:timesync';
import _ from 'underscore';

import { OTR } from './rocketchat.otr';
import { Notifications } from '../../notifications/client';
import { getUidDirectMessage } from '../../../client/lib/utils/getUidDirectMessage';
import { Presence } from '../../../client/lib/presence';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import GenericModal from '../../../client/components/GenericModal';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { otrSystemMessages } from '../lib/constants';
import { IOTRRoom, IOnUserStreamData, userPresenceUsername } from '../../../definition/IOTR';
import { IMessage } from '../../../definition/IMessage';

export class OTRRoom implements IOTRRoom {
	private _userId: string;

	private _roomId: string;

	peerId: string;

	established: ReactiveVar<boolean>;

	establishing: ReactiveVar<boolean>;

	private _keyPair: any;

	private _exportedPublicKey: any;

	private _sessionKey: any;

	declined: ReactiveVar<boolean>;

	isFirstOTR: boolean;

	constructor(userId: string, roomId: string) {
		this._userId = userId;
		this._roomId = roomId;
		this.peerId = getUidDirectMessage(roomId) as string;
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);
		this.isFirstOTR = true;

		this._keyPair = null;
		this._exportedPublicKey = null;
		this._sessionKey = null;
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
			this._keyPair = await OTR.crypto.generateKey(
				{
					name: 'ECDH',
					namedCurve: 'P-256',
				},
				false,
				['deriveKey', 'deriveBits'],
			);

			this._exportedPublicKey = await OTR.crypto.exportKey('jwk', this._keyPair.publicKey);

			// Once we have generated new keys, it's safe to delete old messages
			Meteor.call('deleteOldOTRMessages', this._roomId);
		} catch (e) {
			throw e;
		}
	}

	async importPublicKey(publicKey: any): Promise<void> {
		try {
			const peerPublicKey = await OTR.crypto.importKey(
				'jwk',
				EJSON.parse(publicKey),
				{
					name: 'ECDH',
					namedCurve: 'P-256',
				},
				false,
				[],
			);
			const bits = await OTR.crypto.deriveBits(
				{
					name: 'ECDH',
					namedCurve: 'P-256',
					public: peerPublicKey,
				},
				this._keyPair.privateKey,
				256,
			);
			const hashedBits = await OTR.crypto.digest(
				{
					name: 'SHA-256',
				},
				bits,
			);
			// We truncate the hash to 128 bits.
			const sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
			// Session key available.
			this._sessionKey = await OTR.crypto.importKey(
				'raw',
				sessionKeyData,
				{
					name: 'AES-GCM',
				},
				false,
				['encrypt', 'decrypt'],
			);
		} catch (e) {
			throw e;
		}
	}

	async encryptText(data: Uint8Array): Promise<string> {
		if (!_.isObject(data)) {
			data = new TextEncoder().encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));
		try {
			let cipherText = await OTR.crypto.encrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this._sessionKey,
				data,
			);

			cipherText = new Uint8Array(cipherText);
			const output = new Uint8Array(iv.length + cipherText.length);
			output.set(iv, 0);
			output.set(cipherText, iv.length);

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

	async decrypt(message: string): Promise<EJSONableProperty> {
		try {
			let cipherText = EJSON.parse(message) as Uint8Array;
			const iv = cipherText.slice(0, 12);
			cipherText = cipherText.slice(12);
			const data = await OTR.crypto.decrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this._sessionKey,
				cipherText,
			);

			return EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
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
