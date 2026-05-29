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
		const { result } = await sdk.rest.get('/v1/chat.syncMessages', {
			roomId: rid,
			lastUpdate: lastMessage.ts.toISOString(),
		});
		if (result?.updated?.length) {
			const subscription = Subscriptions.state.find((record) => record.rid === rid);
			await Promise.all(result.updated.map((msg) => upsertMessage({ msg: mapMessageFromApi(msg), subscription })));
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
