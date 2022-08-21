import type { IMessage } from '@rocket.chat/core-typings';
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';

import GenericModal from '../../../client/components/GenericModal';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { Presence } from '../../../client/lib/presence';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { getUidDirectMessage } from '../../../client/lib/utils/getUidDirectMessage';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { Notifications } from '../../notifications/client';
import { APIClient } from '../../utils/client';
import { otrSystemMessages } from '../lib/constants';
import type { IOnUserStreamData, IOTRAlgorithm, IOTRDecrypt, IOTRRoom } from '../lib/IOTR';
import {
	decryptAES,
	deriveBits,
	digest,
	encryptAES,
	exportKey,
	generateKeyPair,
	importKey,
	importKeyRaw,
	joinEncryptedData,
} from '../lib/functions';
import { OtrRoomState } from '../lib/OtrRoomState';

export class OTRRoom implements IOTRRoom {
	private _userId: string;

	private _roomId: string;

	private _keyPair: CryptoKeyPair | null;

	private _exportedPublicKey: JsonWebKey;

	private _sessionKey: CryptoKey | null;

	private _userOnlineComputation: Tracker.Computation;

	private peerId: string;

	private state: ReactiveVar<OtrRoomState> = new ReactiveVar(OtrRoomState.NOT_STARTED);

	private isFirstOTR: boolean;

	constructor(userId: string, roomId: string) {
		this._userId = userId;
		this._roomId = roomId;
		this._keyPair = null;
		this._sessionKey = null;
		this.peerId = getUidDirectMessage(roomId) as string;
		this.isFirstOTR = true;
	}

	getPeerId(): string {
		return this.peerId;
	}

	getState(): OtrRoomState {
		return this.state.get();
	}

	setState(nextState: OtrRoomState): void {
		const currentState = this.state.get();
		if (currentState === nextState) {
			return;
		}

		this.state.set(nextState);
	}

	async handshake(refresh?: boolean): Promise<void> {
		this.setState(OtrRoomState.ESTABLISHING);
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
		APIClient.post('/v1/statistics.telemetry', { params: [{ eventName: 'otrStats', timestamp: Date.now(), rid: this._roomId }] });

		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', {
				roomId: this._roomId,
				userId: this._userId,
				publicKey: EJSON.stringify(this._exportedPublicKey),
			});
	}

	deny(): void {
		this.reset();
		this.setState(OtrRoomState.DECLINED);
		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'deny', {
				roomId: this._roomId,
				userId: this._userId,
			});
	}

	end(): void {
		this.isFirstOTR = true;
		this.reset();
		this.setState(OtrRoomState.NOT_STARTED);
		this.peerId &&
			Notifications.notifyUser(this.peerId, 'otr', 'end', {
				roomId: this._roomId,
				userId: this._userId,
			});
	}

	reset(): void {
		this._keyPair = null;
		this._exportedPublicKey = {};
		this._sessionKey = null;
		Meteor.call('deleteOldOTRMessages', this._roomId);
	}

	async generateKeyPair(): Promise<void> {
		if (this._userOnlineComputation) {
			this._userOnlineComputation.stop();
		}

		this._userOnlineComputation = Tracker.autorun(() => {
			const $room = $(`#chat-window-${this._roomId}`);
			const $title = $('.rc-header__title', $room);
			if (this.state.get() === OtrRoomState.ESTABLISHED) {
				if ($room.length && $title.length && !$('.otr-icon', $title).length) {
					$title.prepend("<i class='otr-icon icon-key'></i>");
				}
			} else if ($title.length) {
				$('.otr-icon', $title).remove();
			}
		});
		try {
			// Generate an ephemeral key pair.
			this._keyPair = await generateKeyPair();

			if (!this._keyPair.publicKey) {
				throw new Error('Public key is not generated');
			}

			this._exportedPublicKey = await exportKey(this._keyPair.publicKey);

			// Once we have generated new keys, it's safe to delete old messages
			Meteor.call('deleteOldOTRMessages', this._roomId);
		} catch (e) {
			this.setState(OtrRoomState.ERROR);
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
			this.setState(OtrRoomState.ERROR);
			throw e;
		}
	}

	async encryptText(data: string | Uint8Array): Promise<string> {
		if (typeof data === 'string') {
			data = new TextEncoder().encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		try {
			if (!this._sessionKey) throw new Error('Session Key not available');

			const iv = crypto.getRandomValues(new Uint8Array(12));
			const encryptedData = await encryptAES({ iv, _sessionKey: this._sessionKey, data });

			const output = joinEncryptedData({ encryptedData, iv });

			return EJSON.stringify(output);
		} catch (e) {
			this.setState(OtrRoomState.ERROR);
			throw new Meteor.Error('encryption-error', 'Encryption error.');
		}
	}

	async encrypt(message: IMessage): Promise<string> {
		try {
			const data = new TextEncoder().encode(
				EJSON.stringify({
					_id: message._id,
					text: message.msg,
					userId: this._userId,
					ack: Random.id((Random.fraction() + 1) * 20),
					ts: new Date(),
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
			dispatchToastMessage({ type: 'error', message: e });
			this.setState(OtrRoomState.ERROR);
			return message;
		}
	}

	async onUserStream(type: string, data: IOnUserStreamData): Promise<void> {
		switch (type) {
			case 'handshake':
				let timeout = 0;

				const establishConnection = async (): Promise<void> => {
					this.setState(OtrRoomState.ESTABLISHING);
					Meteor.clearTimeout(timeout);

					try {
						await this.generateKeyPair();
						await this.importPublicKey(data.publicKey);
						await goToRoomById(data.roomId);
						Meteor.defer(() => {
							this.setState(OtrRoomState.ESTABLISHED);
							this.acknowledge();

							if (data.refresh) {
								Meteor.call('sendSystemMessages', this._roomId, Meteor.user(), otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY);
							}
						});
					} catch (e) {
						dispatchToastMessage({ type: 'error', message: e });
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
					if (!obj?.username) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}

					if (data.refresh && this.state.get() === OtrRoomState.ESTABLISHED) {
						this.reset();
						await establishConnection();
					} else {
						if (this.state.get() === OtrRoomState.ESTABLISHED) {
							this.reset();
						}
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: TAPi18n.__('OTR'),
								children: TAPi18n.__('Username_wants_to_start_otr_Do_you_want_to_accept', {
									username: obj.username,
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
						this.setState(OtrRoomState.TIMEOUT);
						imperativeModal.close();
					}, 10000);
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
				break;

			case 'acknowledge':
				try {
					await this.importPublicKey(data.publicKey);

					this.setState(OtrRoomState.ESTABLISHED);

					if (this.isFirstOTR) {
						Meteor.call('sendSystemMessages', this._roomId, Meteor.user(), otrSystemMessages.USER_JOINED_OTR);
					}
					this.isFirstOTR = false;
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
				break;

			case 'deny':
				if (this.state.get() === OtrRoomState.ESTABLISHING) {
					this.reset();
					this.setState(OtrRoomState.DECLINED);
				}
				break;

			case 'end':
				try {
					const obj = await Presence.get(this.peerId);
					if (!obj?.username) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}

					if (this.state.get() === OtrRoomState.ESTABLISHED) {
						this.reset();
						this.setState(OtrRoomState.NOT_STARTED);
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: TAPi18n.__('OTR'),
								children: TAPi18n.__('Username_ended_the_OTR_session', { username: obj.username }),
								confirmText: TAPi18n.__('Ok'),
								onClose: imperativeModal.close,
								onConfirm: imperativeModal.close,
							},
						});
					}
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}

				break;
		}
	}
}
