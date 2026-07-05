import type { IRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { LegacyRoomManager, upsertMessageBulk } from '../../../../app/ui-utils/client';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { Messages, Subscriptions } from '../../../stores';

type SyncMessagesEndpoint = ReturnType<typeof useEndpoint<'GET', '/v1/chat.syncMessages'>>;

/**
 * Reconciles the messages of a room after a connection loss: everything that
 * was created, edited, or deleted while offline is fetched and applied to the
 * local store.
 */
const syncMissedMessages = async (rid: IRoom['_id'], syncMessages: SyncMessagesEndpoint): Promise<void> => {
	// `_updatedAt` (not `ts`) is the sync baseline: the server query returns any
	// message changed after it, so edits and reactions are not missed
	const lastMessage = Messages.state.findFirst(
		(record) => record.rid === rid && record._hidden !== true && !record.temp,
		(a, b) => b._updatedAt.getTime() - a._updatedAt.getTime(),
	);

	if (!lastMessage) {
		return;
	}

	try {
		const { result } = await syncMessages({ roomId: rid, lastUpdate: lastMessage._updatedAt.toISOString() });

		if (result.updated.length > 0) {
			const subscription = Subscriptions.state.find((record) => record.rid === rid);
			await upsertMessageBulk({ msgs: result.updated.map((message) => mapMessageFromApi(message)), subscription });
		}

		for (const { _id } of result.deleted) {
			Messages.state.delete(_id);
		}
	} catch (error) {
		console.error('Error syncing missed messages:', error);
	}
};

/**
 * React hook that synchronizes missed message changes when connection is restored
 */
export const useLoadMissedMessages = (): void => {
	const { connected } = useConnectionStatus();
	const connectionWasOnlineRef = useRef(connected);
	const syncMessages = useEndpoint('GET', '/v1/chat.syncMessages');

	useEffect(() => {
		if (connected === true && connectionWasOnlineRef.current === false && LegacyRoomManager.openedRooms) {
			Object.keys(LegacyRoomManager.openedRooms).forEach((key) => {
				const value = LegacyRoomManager.openedRooms[key];
				if (value.rid) {
					syncMissedMessages(value.rid, syncMessages);
				}
			});
		}

		connectionWasOnlineRef.current = connected;
	}, [connected, syncMessages]);
};
