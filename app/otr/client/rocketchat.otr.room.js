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

export class OTRRoom {
	constructor(userId, roomId) {
		this.userId = userId;
		this.roomId = roomId;
		this.peerId = getUidDirectMessage(roomId);
		this.established = new ReactiveVar(false);
		this.establishing = new ReactiveVar(false);

		this.userOnlineComputation = null;

		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
	}

	async handshake(refresh) {
		this.establishing.set(true);
		this.firstPeer = true;
		try {
			await this.generateKeyPair();
			Notifications.notifyUser(this.peerId, 'otr', 'handshake', {
				roomId: this.roomId,
				userId: this.userId,
				publicKey: EJSON.stringify(this.exportedPublicKey),
				refresh,
			});
		} catch (e) {
			throw e;
		}
	}

	acknowledge() {
		Notifications.notifyUser(this.peerId, 'otr', 'acknowledge', {
			roomId: this.roomId,
			userId: this.userId,
			publicKey: EJSON.stringify(this.exportedPublicKey),
		});
	}

	deny() {
		this.reset();
		Notifications.notifyUser(this.peerId, 'otr', 'deny', {
			roomId: this.roomId,
			userId: this.userId,
		});
	}

	end() {
		this.reset();
		Notifications.notifyUser(this.peerId, 'otr', 'end', {
			roomId: this.roomId,
			userId: this.userId,
		});
	}

	reset() {
		this.establishing.set(false);
		this.established.set(false);
		this.keyPair = null;
		this.exportedPublicKey = null;
		this.sessionKey = null;
		Meteor.call('deleteOldOTRMessages', this.roomId);
	}

	async generateKeyPair() {
		if (this.userOnlineComputation) {
			this.userOnlineComputation.stop();
		}

		this.userOnlineComputation = Tracker.autorun(() => {
			const $room = $(`#chat-window-${this.roomId}`);
			const $title = $('.rc-header__title', $room);
			if (this.established.get()) {
				if ($room.length && $title.length && !$('.otr-icon', $title).length) {
					$title.prepend("<i class='otr-icon icon-key'></i>");
				}
			} else if ($title.length) {
				$('.otr-icon', $title).remove();
			}
		});

		try {
			// Generate an ephemeral key pair.
			this.keyPair = await OTR.crypto.generateKey(
				{
					name: 'ECDH',
					namedCurve: 'P-256',
				},
				false,
				['deriveKey', 'deriveBits'],
			);

			this.exportedPublicKey = await OTR.crypto.exportKey('jwk', this.keyPair.publicKey);

			// Once we have generated new keys, it's safe to delete old messages
			Meteor.call('deleteOldOTRMessages', this.roomId);
		} catch (e) {
			throw e;
		}
	}

	async importPublicKey(publicKey) {
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
				this.keyPair.privateKey,
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
			this.sessionKey = await OTR.crypto.importKey(
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

	async encryptText(data) {
		if (!_.isObject(data)) {
			data = new TextEncoder('UTF-8').encode(EJSON.stringify({ text: data, ack: Random.id((Random.fraction() + 1) * 20) }));
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));
		try {
			let cipherText = await OTR.crypto.encrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this.sessionKey,
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

	async encrypt(message) {
		let ts;
		if (isNaN(TimeSync.serverOffset())) {
			ts = new Date();
		} else {
			ts = new Date(Date.now() + TimeSync.serverOffset());
		}
		try {
			const data = new TextEncoder('UTF-8').encode(
				EJSON.stringify({
					_id: message._id,
					text: message.msg,
					userId: this.userId,
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

	async decrypt(message) {
		let cipherText = EJSON.parse(message);
		const iv = cipherText.slice(0, 12);
		cipherText = cipherText.slice(12);

		try {
			const data = await OTR.crypto.decrypt(
				{
					name: 'AES-GCM',
					iv,
				},
				this.sessionKey,
				cipherText,
			);

			return EJSON.parse(new TextDecoder('UTF-8').decode(new Uint8Array(data)));
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
			return message;
		}
	}

	async onUserStream(type, data) {
		switch (type) {
			case 'handshake':
				let timeout = null;

				const establishConnection = async () => {
					this.establishing.set(true);
					Meteor.clearTimeout(timeout);

					try {
						await this.generateKeyPair();
						await this.importPublicKey(data.publicKey);
						await goToRoomById(data.roomId);
						Meteor.defer(() => {
							this.established.set(true);
							this.acknowledge();
						});
					} catch (e) {
						dispatchToastMessage({ type: 'error', message: String(e) });
						throw new Meteor.Error('establish-connection-error', 'Establish connection error.');
					}
				};

				const closeOrCancelModal = () => {
					Meteor.clearTimeout(timeout);
					this.deny();
					imperativeModal.close();
				};

				try {
					const { username } = await Presence.get(data.userId);
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
								onClose: () => closeOrCancelModal(),
								onCancel: () => closeOrCancelModal(),
								onConfirm: async () => {
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
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: String(e) });
				}
				break;

			case 'deny':
				try {
					const { username } = await Presence.get(this.peerId);
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
					const { username } = await Presence.get(this.peerId);

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
