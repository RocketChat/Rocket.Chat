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
			// `/v1/chat.syncMessages` returns everything changed since `lastUpdate` by
			// `_updatedAt`, which includes edits to older messages. We only want to
			// upsert messages that are genuinely new (created after our newest loaded
			// message) or that are already loaded (so edits stay in sync), otherwise we
			// would inject stale messages into the room history.
			await Promise.all(
				result.updated
					.map(mapMessageFromApi)
					.filter((msg) => msg.ts.getTime() > lastMessage.ts.getTime() || Messages.state.has(msg._id))
					.map((msg) => upsertMessage({ msg, subscription })),
			);
		}

		// Drop messages that were deleted while the connection was down, but only if
		// they are currently loaded.
		result?.deleted?.forEach(({ _id }) => {
			if (Messages.state.has(_id)) {
				Messages.state.delete(_id);
			}
		});
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
