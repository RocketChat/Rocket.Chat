import type { IRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { LegacyRoomManager, upsertMessage } from '../../../../app/ui-utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { Messages, Subscriptions } from '../../../stores';

/**
 * Loads missed messages for a room
 * @param rid - Room ID
 */
const loadMissedMessages = async (rid: IRoom['_id']): Promise<void> => {
	const lastMessage = Messages.state.findFirst(
		(record) => record.rid === rid && record._hidden !== true && !record.temp,
		(a, b) => b.ts.getTime() - a.ts.getTime(),
	);

	if (!lastMessage) {
		return;
	}

	try {
		const subscription = Subscriptions.state.find((record) => record.rid === rid);
		const oldest = lastMessage.ts.toISOString();

		// `/v1/chat.history` clamps `count` to the server's `API_Upper_Count_Limit`,
		// so a single request can silently drop missed messages when many were sent
		// while offline. Page through with `offset` until a short page is returned.
		const pageSize = 100;
		for (let offset = 0; ; offset += pageSize) {
			const { messages } = await sdk.rest.get('/v1/chat.history', {
				roomId: rid,
				oldest,
				inclusive: 'false',
				count: pageSize,
				offset,
			});

			if (messages.length) {
				await Promise.all(messages.map((msg) => upsertMessage({ msg: mapMessageFromApi(msg), subscription })));
			}

			if (messages.length < pageSize) {
				break;
			}
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
