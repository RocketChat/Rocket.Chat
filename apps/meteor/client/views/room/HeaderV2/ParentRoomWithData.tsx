import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import React from 'react';

import ParentRoom from './ParentRoom';
import ParentRoomWithEndpointData from './ParentRoomWithEndpointData';

type ParentRoomWithDataProps = {
	room: IRoom;
};

const getParentId = ({ prid, teamId }: IRoom): string => {
	if (prid) {
		return prid;
	}

	if (teamId) {
		return teamId;
	}

	throw new Error('Parent room ID is missing');
};

const ParentRoomWithData = ({ room }: ParentRoomWithDataProps) => {
	const parentId = getParentId(room);

	const subscription = useUserSubscription(parentId);
	if (subscription) {
		return <ParentRoom room={{ ...subscription, _id: subscription.rid }} />;
	}

	return <ParentRoomWithEndpointData rid={room._id} />;
};

export default ParentRoomWithData;
