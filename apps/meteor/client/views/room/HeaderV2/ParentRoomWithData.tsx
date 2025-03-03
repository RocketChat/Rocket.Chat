import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';

import ParentRoom from './ParentRoom';
import ParentRoomWithEndpointData from './ParentRoomWithEndpointData';

type ParentRoomWithDataProps = {
	room: IRoom;
};

const ParentRoomWithData = ({ room }: ParentRoomWithDataProps) => {
	const { prid } = room;

	if (!prid) {
		throw new Error('Parent room ID is missing');
	}

	const subscription = useUserSubscription(prid);

	if (subscription) {
		return <ParentRoom room={subscription} />;
	}

	return <ParentRoomWithEndpointData rid={prid} />;
};

export default ParentRoomWithData;
