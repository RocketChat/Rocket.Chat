import type { AtLeast, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { E2EEState } from '../../app/e2e/client/E2EEState';
import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { Subscriptions, ChatRoom } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';
import { isLayoutEmbedded } from '../lib/utils/isLayoutEmbedded';
import { waitUntilFind } from '../lib/utils/waitUntilFind';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		if (!window.crypto) {
			return;
		}

		const enabled = settings.get('E2E_Enable');
		// we don't care about the reactivity of this boolean
		const adminEmbedded = isLayoutEmbedded() && router.getLocationPathname().startsWith('/admin');

		if (enabled && !adminEmbedded) {
			e2e.startClient();
		} else {
			e2e.setState(E2EEState.DISABLED);
			e2e.closeAlert();
		}
	});

	let observable: Meteor.LiveQueryHandle | null = null;
	let offClientMessageReceived: undefined | (() => void);
	let offClientBeforeSendMessage: undefined | (() => void);
	let unsubNotifyUser: undefined | (() => void);
	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			offClientMessageReceived?.();
			unsubNotifyUser?.();
			unsubNotifyUser = undefined;
			observable?.stop();
			offClientBeforeSendMessage?.();
			return;
		}

		unsubNotifyUser = sdk.stream('notify-user', [`${Meteor.userId()}/e2ekeyRequest`], async (roomId, keyId): Promise<void> => {
			const e2eRoom = await e2e.getInstanceByRoomId(roomId);
			if (!e2eRoom) {
				return;
			}

			e2eRoom.provideKeyToUser(keyId);
		}).stop;

		observable = Subscriptions.find().observe({
			changed: async (sub: ISubscription) => {
				setTimeout(async () => {
					if (!sub.encrypted && !sub.E2EKey) {
						e2e.removeInstanceByRoomId(sub.rid);
						return;
					}

					const e2eRoom = await e2e.getInstanceByRoomId(sub.rid);
					if (!e2eRoom) {
						return;
					}

					if (sub.E2ESuggestedKey) {
						if (await e2eRoom.importGroupKey(sub.E2ESuggestedKey)) {
							e2e.acceptSuggestedKey(sub.rid);
						} else {
							console.warn('Invalid E2ESuggestedKey, rejecting', sub.E2ESuggestedKey);
							e2e.rejectSuggestedKey(sub.rid);
						}
					}

					sub.encrypted ? e2eRoom.resume() : e2eRoom.pause();

					// Cover private groups and direct messages
					if (!e2eRoom.isSupportedRoomType(sub.t)) {
						e2eRoom.disable();
						return;
					}

					if (sub.E2EKey && e2eRoom.isWaitingKeys()) {
						e2eRoom.keyReceived();
						return;
					}

					if (!e2eRoom.isReady()) {
						return;
					}

					e2eRoom.decryptSubscription();
				}, 0);
			},
			added: async (sub: ISubscription) => {
				setTimeout(async () => {
					if (!sub.encrypted && !sub.E2EKey) {
						return;
					}
					return e2e.getInstanceByRoomId(sub.rid);
				}, 0);
			},
			removed: (sub: ISubscription) => {
				e2e.removeInstanceByRoomId(sub.rid);
			},
		});

		offClientMessageReceived = onClientMessageReceived.use(async (msg: IMessage) => {
			const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
			if (!e2eRoom?.shouldConvertReceivedMessages()) {
				return msg;
			}
			return e2e.decryptMessage(msg);
		});

		// Encrypt messages before sending
		offClientBeforeSendMessage = onClientBeforeSendMessage.use(async (message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>) => {
			const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

			if (!e2eRoom) {
				return message;
			}

			const subscription = await waitUntilFind(() => ChatRoom.findOne({ _id: message.rid }));

			subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

			const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages(message);

			if (!shouldConvertSentMessages) {
				return message;
			}

			// Should encrypt this message.
			const msg = await e2eRoom.encrypt(message);
			message.msg = msg;
			message.t = 'e2e';
			message.e2e = 'pending';
			return message;
		});
	});
});
