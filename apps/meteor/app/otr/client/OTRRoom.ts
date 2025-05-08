import type { IRoom, IMessage, IUser, UserPresence } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import EJSON from 'ejson';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import GenericModal from '../../../client/components/GenericModal';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { Presence } from '../../../client/lib/presence';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { getUidDirectMessage } from '../../../client/lib/utils/getUidDirectMessage';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { Messages } from '../../models/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';
import type { IOnUserStreamData, IOTRAlgorithm, IOTRDecrypt, IOTRRoom } from '../lib/IOTR';
import { OtrRoomState } from '../lib/OtrRoomState';
import { otrSystemMessages } from '../lib/constants';
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

	private onPresenceEventHook: (event: UserPresence | undefined) => void;

	protected constructor(uid: IUser['_id'], rid: IRoom['_id'], peerId: IUser['_id']) {
		this._userId = uid;
		this._roomId = rid;
		this._keyPair = null;
		this._sessionKey = null;
		this.peerId = peerId;
		this.isFirstOTR = true;
		this.onPresenceEventHook = this.onPresenceEvent.bind(this);
	}

	public static create(uid: IUser['_id'], rid: IRoom['_id']): OTRRoom | undefined {
		const peerId = getUidDirectMessage(rid);

		if (!peerId) {
			return undefined;
		}

		return new OTRRoom(uid, rid, peerId);
	}

	getPeerId(): string {
		return this.peerId;
	}

	getState(): OtrRoomState {
		return this.state.get();
	}

	setState(nextState: OtrRoomState): void {
		if (this.getState() === nextState) {
			return;
		}

		this.state.set(nextState);
	}

	async handshake(refresh?: boolean): Promise<void> {
		this.setState(OtrRoomState.ESTABLISHING);

		await this.generateKeyPair();
		sdk.publish('notify-user', [
			`${this.peerId}/otr`,
			'handshake',
			{
				roomId: this._roomId,
				userId: this._userId,
				publicKey: EJSON.stringify(this._exportedPublicKey),
				refresh,
			},
		]);

		if (refresh) {
			const user = Meteor.user();
			if (!user) {
				return;
			}
			await sdk.rest.post('/v1/chat.otr', {
				roomId: this._roomId,
				type: otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
			});
			this.isFirstOTR = false;
		}
	}

	onPresenceEvent(event: UserPresence | undefined): void {
		if (!event) {
			return;
		}
		if (event.status !== UserStatus.OFFLINE) {
			return;
		}
		console.warn(`OTR Room ${this._roomId} ended because ${this.peerId} went offline`);
		this.end();

		imperativeModal.open({
			component: GenericModal,
			props: {
				variant: 'warning',
				title: t('OTR'),
				children: t('OTR_Session_ended_other_user_went_offline', { username: event.username }),
				confirmText: t('Ok'),
				onClose: imperativeModal.close,
				onConfirm: imperativeModal.close,
			},
		});
	}

	// Starts listening to other user's status changes and end OTR if any of the Users goes offline
	// this should be called in 2 places: on acknowledge (meaning user accepted OTR) or on establish (meaning user initiated OTR)
	listenToUserStatus(): void {
		Presence.listen(this.peerId, this.onPresenceEventHook);
	}

	acknowledge(): void {
		void sdk.rest.post('/v1/statistics.telemetry', { params: [{ eventName: 'otrStats', timestamp: Date.now(), rid: this._roomId }] });

		sdk.publish('notify-user', [
			`${this.peerId}/otr`,
			'acknowledge',
			{
				roomId: this._roomId,
				userId: this._userId,
				publicKey: EJSON.stringify(this._exportedPublicKey),
			},
		]);
	}

	deny(): void {
		this.reset();
		this.setState(OtrRoomState.DECLINED);
		sdk.publish('notify-user', [
			`${this.peerId}/otr`,
			'deny',
			{
				roomId: this._roomId,
				userId: this._userId,
			},
		]);
	}

	softReset(): void {
		this.isFirstOTR = true;
		this.setState(OtrRoomState.NOT_STARTED);
		this._keyPair = null;
		this._exportedPublicKey = {};
		this._sessionKey = null;
	}

	deleteOTRMessages(): void {
		Messages.remove({ t: { $in: ['otr', 'otr-ack', ...Object.values(otrSystemMessages)] }, rid: this._roomId });
	}

	end(): void {
		this.isFirstOTR = true;
		this.reset();
		this.setState(OtrRoomState.NOT_STARTED);
		Presence.stop(this.peerId, this.onPresenceEventHook);
		this.deleteOTRMessages();
		sdk.publish('notify-user', [
			`${this.peerId}/otr`,
			'end',
			{
				roomId: this._roomId,
				userId: this._userId,
			},
		]);
	}

	reset(): void {
		this._keyPair = null;
		this._exportedPublicKey = {};
		this._sessionKey = null;
		void sdk.call('deleteOldOTRMessages', this._roomId);
	}

	async generateKeyPair(): Promise<void> {
		if (this._userOnlineComputation) {
			this._userOnlineComputation.stop();
		}

		this._userOnlineComputation = Tracker.autorun(() => {
			const $room = document.querySelector(`#chat-window-${this._roomId}`);
			const $title = $room?.querySelector('.rc-header__title');
			if (this.getState() === OtrRoomState.ESTABLISHED) {
				if ($room && $title && !$title.querySelector('.otr-icon')) {
					$title.prepend("<i class='otr-icon icon-key'></i>");
				}
			} else if ($title) {
				$title.querySelector('.otr-icon')?.remove();
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
			void sdk.call('deleteOldOTRMessages', this._roomId);
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

	async encrypt(message: Pick<IMessage, '_id' | 'msg'>): Promise<string> {
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
				let timeout: NodeJS.Timeout;

				const establishConnection = async (): Promise<void> => {
					this.setState(OtrRoomState.ESTABLISHING);
					clearTimeout(timeout);
					try {
						if (!data.publicKey) throw new Error('Public key is not generated');
						await this.generateKeyPair();
						await this.importPublicKey(data.publicKey);
						await goToRoomById(data.roomId);
						setTimeout(async () => {
							this.setState(OtrRoomState.ESTABLISHED);
							this.acknowledge();
							this.listenToUserStatus();

							if (data.refresh) {
								await sdk.rest.post('/v1/chat.otr', {
									roomId: this._roomId,
									type: otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
								});
							}
						}, 0);
					} catch (e) {
						dispatchToastMessage({ type: 'error', message: e });
						throw new Meteor.Error('establish-connection-error', 'Establish connection error.');
					}
				};

				const closeOrCancelModal = (): void => {
					clearTimeout(timeout);
					this.deny();
					imperativeModal.close();
				};

				try {
					const obj = await Presence.get(data.userId);
					if (!obj?.username) {
						throw new Meteor.Error('user-not-defined', 'User not defined.');
					}

					if (data.refresh && this.getState() === OtrRoomState.ESTABLISHED) {
						this.reset();
						await establishConnection();
					} else {
						/* 	We have to check if there's an in progress handshake request because
							Notifications.notifyUser will sometimes dispatch 2 events */
						if (this.getState() === OtrRoomState.REQUESTED) {
							return;
						}

						if (this.getState() === OtrRoomState.ESTABLISHED) {
							this.reset();
						}

						this.setState(OtrRoomState.REQUESTED);
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: t('OTR'),
								children: t('Username_wants_to_start_otr_Do_you_want_to_accept', {
									username: obj.username,
								}),
								confirmText: t('Yes'),
								cancelText: t('No'),
								onClose: (): void => closeOrCancelModal(),
								onCancel: (): void => closeOrCancelModal(),
								onConfirm: async (): Promise<void> => {
									await establishConnection();
									imperativeModal.close();
								},
							},
						});
						timeout = setTimeout(() => {
							this.setState(OtrRoomState.TIMEOUT);
							imperativeModal.close();
						}, 10000);
					}
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
				break;

			case 'acknowledge':
				try {
					if (!data.publicKey) throw new Error('Public key is not generated');
					await this.importPublicKey(data.publicKey);

					this.setState(OtrRoomState.ESTABLISHED);

					if (this.isFirstOTR) {
						this.listenToUserStatus();
						await sdk.rest.post('/v1/chat.otr', {
							roomId: this._roomId,
							type: otrSystemMessages.USER_JOINED_OTR,
						});
					}
					this.isFirstOTR = false;
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
				break;

			case 'deny':
				if (this.getState() === OtrRoomState.ESTABLISHING) {
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

					if (this.getState() === OtrRoomState.ESTABLISHED) {
						this.reset();
						this.setState(OtrRoomState.NOT_STARTED);
						this.deleteOTRMessages();
						imperativeModal.open({
							component: GenericModal,
							props: {
								variant: 'warning',
								title: t('OTR'),
								children: t('Username_ended_the_OTR_session', { username: obj.username }),
								confirmText: t('Ok'),
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
