import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import ChannelHoverCard from './ChannelHoverCard';
import DirectMessageHoverCard from './DirectMessageHoverCard';
import { getUidDirectMessage } from '../../lib/utils/getUidDirectMessage';
import { mapRoomFromApi } from '../../lib/utils/mapRoomFromApi';

export type RoomHoverCardWithDataProps = {
	rid: IRoom['_id'];
	onClose: () => void;
};

const RoomHoverCardWithData = ({ rid, onClose }: RoomHoverCardWithDataProps) => {
	const userId = useUserId();
	const storedRoom = useUserRoom(rid);
	const subscription = useUserSubscription(rid);

	// The client's room cache can lack rooms the user is subscribed to; the card then asks the server for the room.
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const { data: fetchedRoom } = useQuery({
		queryKey: ['sidebar', 'room-hover-card', rid, 'room'],
		queryFn: async () => {
			const { room } = await getRoomInfo({ roomId: rid });
			return room ? mapRoomFromApi(room) : null;
		},
		enabled: !storedRoom,
		staleTime: 60_000,
	});

	const room = storedRoom ?? fetchedRoom;

	if (!room || !subscription) {
		return null;
	}

	const uid = getUidDirectMessage(room, userId ?? undefined);

	if (uid) {
		return <DirectMessageHoverCard uid={uid} room={room} subscription={subscription} onClose={onClose} />;
	}

	return <ChannelHoverCard room={room} subscription={subscription} onClose={onClose} />;
};

export default RoomHoverCardWithData;
