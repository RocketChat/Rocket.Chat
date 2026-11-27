import type { IRoom, IVideoConferenceRoom } from '@rocket.chat/core-typings';
import { useConnectionStatus, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { ConferenceLink } from './ConferenceLink';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

type ConferenceRoomRow = Pick<IVideoConferenceRoom, '_id' | 'title' | 'url'> & { ongoingCallId?: string };

const toConferenceLink = ({ _id, title, url, ongoingCallId }: ConferenceRoomRow): ConferenceLink => ({
	_id,
	title,
	url,
	ongoing: !!ongoingCallId,
});

/**
 * The conference links of a room, read again whenever the room announces a conference and once each time the room
 * starts being watched again.
 */
export const usePersistentConferenceRooms = (rid: IRoom['_id']) => {
	const listRooms = useEndpoint('GET', '/v1/video-conference.rooms.list');
	const queryClient = useQueryClient();
	const subscribeToNotifyRoom = useStream('notify-room');
	const { connected } = useConnectionStatus();

	const query = useQuery({
		queryKey: videoConferenceQueryKeys.persistentRooms(rid),
		queryFn: async () => (await listRooms({ roomId: rid })).rooms.map(toConferenceLink),
	});

	// Subscribed per connection: one lost with the socket leaves the list watching nothing.
	useEffect(() => {
		if (!connected) {
			return;
		}

		const queryKey = videoConferenceQueryKeys.persistentRooms(rid);
		const stop = subscribeToNotifyRoom(`${rid}/videoconf`, () => void queryClient.invalidateQueries({ queryKey }));

		// Announcements made while nobody here was listening.
		void queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });

		return stop;
	}, [connected, rid, queryClient, subscribeToNotifyRoom]);

	return query;
};
