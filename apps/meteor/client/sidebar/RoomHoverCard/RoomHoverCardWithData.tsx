import type { IRoom } from '@rocket.chat/core-typings';
import { useUserId, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';

import ChannelHoverCard from './ChannelHoverCard';
import DirectMessageHoverCard from './DirectMessageHoverCard';
import { getUidDirectMessage } from '../../lib/utils/getUidDirectMessage';

export type RoomHoverCardWithDataProps = {
	rid: IRoom['_id'];
	onClose: () => void;
};

const RoomHoverCardWithData = ({ rid, onClose }: RoomHoverCardWithDataProps) => {
	const userId = useUserId();
	const room = useUserRoom(rid);
	const subscription = useUserSubscription(rid);

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
