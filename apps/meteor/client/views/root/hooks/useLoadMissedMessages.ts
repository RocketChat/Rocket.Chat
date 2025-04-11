import type { IRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { Messages, Subscriptions } from '../../../../app/models/client';
import { LegacyRoomManager, upsertMessage } from '../../../../app/ui-utils/client';
import { callWithErrorHandling } from '../../../lib/utils/callWithErrorHandling';

/**
 * Loads missed messages for a room
 * @param rid - Room ID
 */
const loadMissedMessages = async (rid: IRoom['_id']): Promise<void> => {
	const lastMessage = Messages.findOne({ rid, _hidden: { $ne: true }, temp: { $exists: false } }, { sort: { ts: -1 }, limit: 1 });

	if (!lastMessage) {
		return;
	}

	try {
		const result = await callWithErrorHandling('loadMissedMessages', rid, lastMessage.ts);
		if (result) {
			const subscription = Subscriptions.findOne({ rid });
			await Promise.all(Array.from(result).map((msg) => upsertMessage({ msg, subscription })));
		}
	} catch (error) {
		console.error('Error loading missed messages:', error);
	}
};

/**
 * React hook that loads missed messages when connection is restored
 */
export const useLoadMissedMessages = (): void => {
	const { connected } = useConnectionStatus();
	const connectionWasOnlineRef = useRef(connected);

	useEffect(() => {
		if (connected === true && connectionWasOnlineRef.current === false && LegacyRoomManager.openedRooms) {
			Object.keys(LegacyRoomManager.openedRooms).forEach((key) => {
				const value = LegacyRoomManager.openedRooms[key];
				if (value.rid) {
					loadMissedMessages(value.rid);
				}
			});
		}

		connectionWasOnlineRef.current = connected;
	}, [connected]);
};
