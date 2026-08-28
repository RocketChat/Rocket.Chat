import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { LegacyRoomManager } from '../../../lib/LegacyRoomManager';
import { upsertMessageBulk } from '../../../lib/RoomHistoryManager';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { Messages } from '../../../stores/Messages';
import { Subscriptions } from '../../../stores/Subscriptions';

/**
 * Reconciles a room with the server after the connection drops.
 *
 * `lastUpdate` is the newest loaded message's timestamp, so anything created or edited since then comes
 * back. `fromTs` is the oldest loaded one, which bounds the query to the window the client actually holds
 * — without it the server has no usable index bounds and scans every message in the room. The trade-off
 * is that edits to messages older than `fromTs` go unreported, which is fine here: those messages are not
 * loaded, so they are fetched fresh if the user scrolls back to them.
 *
 * @param rid - Room ID
 */
const loadMissedMessages = async (rid: IRoom['_id']): Promise<void> => {
	const isLoaded = (record: IMessage & { temp?: boolean }) => record.rid === rid && record._hidden !== true && !record.temp;

	const newestLoaded = Messages.state.findFirst(isLoaded, (a, b) => b.ts.getTime() - a.ts.getTime());
	const oldestLoaded = Messages.state.findFirst(isLoaded, (a, b) => a.ts.getTime() - b.ts.getTime());

	if (!newestLoaded || !oldestLoaded) {
		return;
	}

	try {
		const { result } = await sdk.rest.get('/v1/chat.syncMessages', {
			roomId: rid,
			lastUpdate: newestLoaded.ts.toISOString(),
			fromTs: oldestLoaded.ts.toISOString(),
		});

		const subscription = Subscriptions.state.find((record) => record.rid === rid);

		await upsertMessageBulk({ msgs: result.updated.map((msg) => mapMessageFromApi(msg)), subscription });

		const deletedIds = new Set<IMessage['_id']>();

		for (const { _id } of result.deleted) {
			Messages.state.delete(_id);
			deletedIds.add(_id);
		}

		if (deletedIds.size > 0) {
			// remove thread reference from deleted messages
			Messages.state.update(
				(record) => record.tmid !== undefined && deletedIds.has(record.tmid),
				({ tmid: _, ...record }) => record,
			);
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
