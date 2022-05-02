import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { TimeSync } from 'meteor/mizzao:timesync';
import _ from 'underscore';

import { OTR } from './rocketchat.otr';
import { Notifications } from '../../notifications';
import { getUidDirectMessage } from '../../../client/lib/utils/getUidDirectMessage';
import { Presence } from '../../../client/lib/presence';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import GenericModal from '../../../client/components/GenericModal';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { OtrRoomState } from './OtrRoomState';
import { otrSystemMessages } from '../lib/constants';
import { APIClient } from '../../utils/client';

OTR.Room = class {
	constructor(userId, roomId) {
		this.userId = userId;
		this.roomId = roomId;
		this.peerId = getUidDirectMessage(roomId);
		this.state = new ReactiveVar(OtrRoomState.NOT_STARTED);

		this.isFirstOTR = true;

		this.userOnlineComputation = null;

		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
	}

	setState(nextState) {
		const currentState = this.state.get();
		if (currentState === nextState) {
			return;
		}

		this.state.set(nextState);
	}

	handshake(refresh) {
		this.setState(OtrRoomState.ESTABLISHING);
		this.firstPeer = true;
		this.generateKeyPair().then(() => {
			Notifications.notifyUser(this.peerId, 'otr', 'handshake', {
				roomId: this.roomId,
				userId: this.userId,
				publicKey: EJSON.stringify(this.exportedPublicKey),
				refresh,
			});
		});
		if (refresh) {
			Meteor.call('sendSystemMessages', this.roomId, Meteor.user(), otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH);
			this.isFirstOTR = false;
		}
	}

	acknowledge() {
		APIClient.v1.post('statistics.telemetry', { params: [{ eventName: 'otrStats', timestamp: Date.now(), rid: this.roomId }] });

		Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', {
			roomId: this.roomId,
			userId: this.userId,
			publicKey: EJSON.stringify(this.exportedPublicKey),
		});
	}

	deny() {
		this.reset();
		this.setState(OtrRoomState.DECLINED);
		Notifications.notifyUser(this.peerId, 'otr', 'deny', {
			roomId: this.roomId,
			userId: this.userId,
		});
	}

	end() {
		this.isFirstOTR = true;
		this.reset();
		this.setState(OtrRoomState.NOT_STARTED);
		Notifications.notifyUser(this.peerId, 'otr', 'end', {
			roomId: this.roomId,
			userId: this.userId,
		});
	}

	reset() {
		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
		Meteor.call('deleteOldOTRMessages', this.roomId);
	}

	generateKeyPair() {
		if (this.userOnlineComputation) {
			this.userOnlineComputation.stop();
		}

		this.userOnlineComputation = Tracker.autorun(() => {
			const $room = $(`#chat-window-${this.roomId}`);
			const $title = $('.rc-header__title', $room);
			if (this.state.get() === OtrRoomState.ESTABLISHED) {
				if ($room.length && $title.length && !$('.otr-icon', $title).length) {
					$title.prepend("<i class='otr-icon icon-key'></i>");
				}
			} else if ($title.length) {
				$('.otr-icon', $title).remove();
			}
		});

		// Generate an ephemeral key pair.
		return OTR.crypto
			.generateKey(
				{
					name: 'ECDH',
					namedCurve: 'P-256',
				},
				false,
				['deriveKey', 'deriveBits'],
			)
			.then((keyPair) => {
				this.keyPair = keyPair;
				return OTR.crypto.exportKey('jwk', keyPair.publicKey);
			})
			.then((exportedPublicKey) => {
				this.exportedPublicKey = exportedPublicKey;

				// Once we have generated new keys, it's safe to delete old messages
				Meteor.call('deleteOldOTRMessages', this.roomId);
			})
			.catch((e) => {
				this.setState(OtrRoomState.ERROR);
				dispatchToastMessage({ type: 'error', message: e });
			});
	}

	importPublicKey(publicKey) {
		return OTR.crypto
			.importKey(
				'jwk',
				EJSON.parse(publicKey),
				{
					name: 'ECDH',
					namedCurve: 'P-256',
				},
				false,
				[],
			)
			.then((peerPublicKey) =>
				OTR.crypto.deriveBits(
					{
						name: 'ECDH',
						namedCurve: 'P-256',
						public: peerPublicKey,
					},
					this.keyPair.privateKey,
					256,
				),
			)
			.then((bits) =>
				OTR.crypto.digest(
					{
						name: 'SHA-256',
					},
					bits,
				),
			)
			.then((hashedBits) => {
				// We truncate the hash to 128 bits.
				const sessionKeyData = new Uint8Array(hashedBits).slice(0, 16);
				return OTR.crypto.importKey(
					'raw',
					sessionKeyData,
					{
						name: 'AES-GCM',
					},
					false,
					['encrypt', 'decrypt'],
				);
			})
			.then((sessionKey) => {
				// Session key available.
				this.sessionKey = sessionKey;
			});
	}

	encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));

		return OTR.crypto
			.encrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this.sessionKey,
				data,
			)
			.then((cipherText) => {
				cipherText = new Uint8Array(cipherText);
				const output = new Uint8Array(iv.length + cipherText.length);
				output.set(iv, 0);
				output.set(cipherText, iv.length);
				return EJSON.stringify(output);
			})
			.catch(() => {
				this.setState(OtrRoomState.ERROR);
				throw new Meteor.Error('encryption-error', 'Encryption error.');
			});
	}

	encrypt(message) {
		let ts;
		if (isNaN(TimeSync.serverOffset())) {
			ts = new Date();
		} else {
			ts = new Date(Date.now() + TimeSync.serverOffset());
		}

		const data = new TextEncoder('UTF-8').encode(
			EJSON.stringify({
				_id: message._id,
				text: message.msg,
				userId: this.userId,
				ack: Random.id((Random.fraction() + 1) * 20),
				ts,
			}),
		);
		const enc = this.encryptText(data);
		return enc;
	}

	decrypt(message) {
		let cipherText = EJSON.parse(message);
		const iv = cipherText.slice(0, 12);
		cipherText = cipherText.slice(12);

		return OTR.crypto
			.decrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this.sessionKey,
				cipherText,
			)
			.then((data) => {
				data = EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
				return data;
			})
			.catch((e) => {
				dispatchToastMessage({ type: 'error', message: e });
				this.setState(OtrRoomState.ERROR);
				return message;
			});
	}

	onUserStream(type, data) {
		switch (type) {
			case 'handshake':
				let timeout = null;
				const establishConnection = () => {
					this.setState(OtrRoomState.ESTABLISHING);
					Meteor.clearTimeout(timeout);
					this.generateKeyPair().then(() => {
						this.importPublicKey(data.publicKey).then(() => {
							this.firstPeer = false;
							goToRoomById(data.roomId);
							Meteor.defer(() => {
								this.setState(OtrRoomState.ESTABLISHED);
								this.acknowledge();
								if (data.refresh) {
									Meteor.call('sendSystemMessages', this.roomId, Meteor.user(), otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY);
								}
							});
						});
					});
				};

				(async () => {
					const { username } = await Presence.get(data.userId);
					if (data.refresh && this.state.get() === OtrRoomState.ESTABLISHED) {
						this.reset();
						establishConnection();
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
									username,
								}),
								confirmText: TAPi18n.__('Yes'),
								cancelText: TAPi18n.__('No'),
								onClose: () => {
									Meteor.clearTimeout(timeout);
									this.deny();
									imperativeModal.close();
								},
								onCancel: () => {
									Meteor.clearTimeout(timeout);
									this.deny();
									imperativeModal.close();
								},
								onConfirm: () => {
									establishConnection();
									imperativeModal.close();
								},
							},
						});
					}

					timeout = Meteor.setTimeout(() => {
						this.setState(OtrRoomState.TIMEOUT);
						imperativeModal.close();
					}, 10000);
				})();
				break;

			case 'acknowledge':
				this.importPublicKey(data.publicKey).then(() => {
					this.setState(OtrRoomState.ESTABLISHED);
				});
				if (this.isFirstOTR) {
					Meteor.call('sendSystemMessages', this.roomId, Meteor.user(), otrSystemMessages.USER_JOINED_OTR);
				}
				this.isFirstOTR = false;
				break;

			case 'deny':
				(async () => {
					if (this.state.get() === OtrRoomState.ESTABLISHING) {
						this.reset();
						this.setState(OtrRoomState.DECLINED);
					}
				})();
				break;

			case 'end':
				(async () => {
					const { username } = await Presence.get(this.peerId);

					if (this.state.get() === OtrRoomState.ESTABLISHED) {
						this.reset();
						this.setState(OtrRoomState.NOT_STARTED);
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
				})();
				break;
		}
	}
};
