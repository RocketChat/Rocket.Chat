import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEPinnedMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { E2EEState } from '../../app/e2e/client/E2EEState';
import { e2e } from '../../app/e2e/client/rocketchat.e2e';
import { MentionsParser } from '../../app/mentions/lib/MentionsParser';
import { ChatRoom } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { onClientBeforeSendMessage } from '../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../lib/onClientMessageReceived';
import { isLayoutEmbedded } from '../lib/utils/isLayoutEmbedded';
import { waitUntilFind } from '../lib/utils/waitUntilFind';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			e2e.log('Not logged in');
			return;
		}

		if (!window.crypto) {
			e2e.error('No crypto support');
			return;
		}

		const enabled = settings.get('E2E_Enable');
		// we don't care about the reactivity of this boolean
		const adminEmbedded = isLayoutEmbedded() && router.getLocationPathname().startsWith('/admin');

		if (enabled && !adminEmbedded) {
			e2e.log('E2E enabled starting client');
			e2e.startClient();
		} else {
			e2e.log('E2E disabled');
			e2e.setState(E2EEState.DISABLED);
			e2e.closeAlert();
		}
	});

	let offClientMessageReceived: undefined | (() => void);
	let offClientBeforeSendMessage: undefined | (() => void);
	let listenersAttached = false;

	Tracker.autorun(() => {
		if (!e2e.isReady()) {
			e2e.log('Not ready');
			offClientMessageReceived?.();
			offClientBeforeSendMessage?.();
			listenersAttached = false;
			return;
		}

		if (listenersAttached) {
			e2e.log('Listeners already attached');
			return;
		}

		offClientMessageReceived = onClientMessageReceived.use(async (msg: IMessage) => {
			const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
			if (!e2eRoom?.shouldConvertReceivedMessages()) {
				return msg;
			}

			if (isE2EEPinnedMessage(msg)) {
				return e2e.decryptPinnedMessage(msg);
			}

			return e2e.decryptMessage(msg);
		});

		// Encrypt messages before sending
		offClientBeforeSendMessage = onClientBeforeSendMessage.use(async (message) => {
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

			const mentionsEnabled = settings.get<boolean>('E2E_Enabled_Mentions');

			if (mentionsEnabled) {
				const me = Meteor.user()?.username || '';
				const pattern = settings.get('UTF8_User_Names_Validation');
				const useRealName = settings.get('UI_Use_Real_Name');

				const mentions = new MentionsParser({
					pattern: () => pattern,
					useRealName: () => useRealName,
					me: () => me,
				});

				const e2eMentions: IMessage['e2eMentions'] = {
					e2eUserMentions: mentions.getUserMentions(message.msg),
					e2eChannelMentions: mentions.getChannelMentions(message.msg),
				};

				message.e2eMentions = e2eMentions;
			}

			// Should encrypt this message.
			return e2eRoom.encryptMessage(message);
		});

		listenersAttached = true;
		e2e.log('Listeners attached', listenersAttached);
	});
});
