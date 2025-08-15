import { isE2EEPinnedMessage, type IRoom, type IMessage } from '@rocket.chat/core-typings';
import { useUserId, useSetting, useRouter, useLayout, useUser } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { e2e } from '../../../../../app/e2e/client';
import { E2EEState } from '../../../../../app/e2e/client/E2EEState';
import { MentionsParser } from '../../../../../app/mentions/lib/MentionsParser';
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
			e2e.log('Not logged in');
			return;
		}

		if (!window.crypto) {
			e2e.error('No crypto support');
			return;
		}

		if (enabled && !adminEmbedded) {
			e2e.log('E2E enabled starting client');
			e2e.startClient();
		} else {
			e2e.log('E2E disabled');
			e2e.setState(E2EEState.DISABLED);
			e2e.closeAlert();
		}
	}, [adminEmbedded, enabled, userId]);

	const state = useE2EEState();
	const ready = state === E2EEState.READY || state === E2EEState.SAVE_PASSWORD;
	const listenersAttachedRef = useRef(false);

	const mentionsEnabled = useSetting('E2E_Enabled_Mentions', true);
	const me = useUser()?.username || '';
	const pattern = useSetting('UTF8_User_Names_Validation', '[0-9a-zA-Z-_.]+');
	const useRealName = useSetting('UI_Use_Real_Name', false);

	useEffect(() => {
		if (!ready) {
			e2e.log('Not ready');
			return;
		}

		if (listenersAttachedRef.current) {
			e2e.log('Listeners already attached');
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
			return e2eRoom.encryptMessage(message);
		});

		listenersAttachedRef.current = true;
		e2e.log('Listeners attached');

		return () => {
			e2e.log('Not ready');
			offClientMessageReceived();
			offClientBeforeSendMessage();
			listenersAttachedRef.current = false;
		};
	}, [me, mentionsEnabled, pattern, ready, useRealName]);
};
