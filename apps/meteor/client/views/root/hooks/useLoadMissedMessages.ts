import type { IRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

import { LegacyRoomManager, upsertMessageBulk } from '../../../../app/ui-utils/client';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { Messages, Subscriptions } from '../../../stores';

/**
 * React hook that loads missed messages when connection is restored
 */
export const useLoadMissedMessages = (): void => {
	const { connected } = useConnectionStatus();
	const connectionWasOnlineRef = useRef(connected);
	const syncMessages = useEndpoint('GET', '/v1/chat.syncMessages');

	/**
	 * Loads missed messages for a room, reconciling both edits and deletions
	 * that happened while the client was disconnected.
	 * @param rid - Room ID
	 */
	const loadMissedMessages = useCallback(
		async (rid: IRoom['_id']): Promise<void> => {
			// The sync anchor must be `_updatedAt`, not `ts`: an offline edit/delete bumps
			// `_updatedAt` without changing `ts`, so anchoring on `ts` would miss it.
			// `_hidden` and `temp` (optimistic/local-only) messages are excluded so they never
			// become the anchor for an epoch the server doesn't know about.
			const lastMessage = Messages.state.findFirst(
				(record) => record.rid === rid && record._hidden !== true && !record.temp,
				(a, b) => b._updatedAt.getTime() - a._updatedAt.getTime(),
			);

			if (!lastMessage) {
				return;
			}

			try {
				const { result } = await syncMessages({ roomId: rid, lastUpdate: lastMessage._updatedAt.toISOString() });

				const subscription = Subscriptions.state.find((record) => record.rid === rid);

				if (result.updated.length) {
					// `upsertMessageBulk` routes every message through the same pipeline used for
					// live/history messages (`onClientMessageReceived`), so E2E decryption is
					// applied transparently for encrypted rooms.
					await upsertMessageBulk({ msgs: result.updated.map(mapMessageFromApi), subscription });
				}

				result.deleted.forEach(({ _id }) => Messages.state.delete(_id));
			} catch (error) {
				console.error('Error loading missed messages:', error);
			}
		},
		[syncMessages],
	);

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
	}, [connected, loadMissedMessages]);
};
