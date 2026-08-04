import { isE2EEPinnedMessage, type IRoom, type IMessage } from '@rocket.chat/core-typings';
import { useUserId, useSetting, useRouter, useLayout, useUser } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { MentionsParser } from '../../../../../app/mentions/lib/MentionsParser';
import { e2e } from '../../../../lib/e2ee';
import { onClientBeforeSendMessage } from '../../../../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../../../lib/onClientMessageReceived';
import { Rooms } from '../../../../stores';
import { useE2EEState } from '../../../room/hooks/useE2EEState';

export const useE2EEncryption = () => {
	const userId = useUserId();
	const enabled = useSetting('E2E_Enable', false);
	const router = useRouter();
	// we don't care about the reactivity of this boolean
	const adminEmbedded = useLayout().isEmbedded && router.getLocationPathname().startsWith('/admin');

	useEffect(() => {
		if (!userId) {
			return;
		}

		if (enabled && !adminEmbedded) {
			e2e.startClient(userId);
		} else {
			e2e.setState('DISABLED');
			e2e.closeAlert();
		}
	}, [adminEmbedded, enabled, userId]);

	const state = useE2EEState();
	const ready = state === 'READY' || state === 'SAVE_PASSWORD';
	const listenersAttachedRef = useRef(false);

	const mentionsEnabled = useSetting('E2E_Enabled_Mentions', true);
	const me = useUser()?.username || '';
	const pattern = useSetting('UTF8_User_Names_Validation', '[0-9a-zA-Z-_.]+');
	const useRealName = useSetting('UI_Use_Real_Name', false);

	useEffect(() => {
		if (!ready) {
			return;
		}

		if (listenersAttachedRef.current) {
			return;
		}

		const offClientMessageReceived = onClientMessageReceived.use(async (msg) => {
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
		const offClientBeforeSendMessage = onClientBeforeSendMessage.use(async (message) => {
			const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

			if (!e2eRoom) {
				return message;
			}

			// e2e.getInstanceByRoomId already waits for the room to be available which means this logic needs to be
			// refactored to avoid waiting for the room again
			const subscription = await new Promise<IRoom>((resolve) => {
				const room = Rooms.state.get(message.rid);

				if (room) resolve(room);

				const unsubscribe = Rooms.use.subscribe((state) => {
					const room = state.get(message.rid);
					if (room) {
						unsubscribe();
						resolve(room);
					}
				});
			});

			subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

			const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages(message);

			if (!shouldConvertSentMessages) return message;

			if (mentionsEnabled) {
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
			const encryptedMessage = await e2eRoom.encryptMessage(message);
			return encryptedMessage;
		});

		listenersAttachedRef.current = true;

		return () => {
			offClientMessageReceived();
			offClientBeforeSendMessage();
			listenersAttachedRef.current = false;
		};
	}, [me, mentionsEnabled, pattern, ready, useRealName]);
};
