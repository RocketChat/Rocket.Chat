import React, { ReactElement } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useUserSubscription } from '../../../contexts/UserContext';
import ParentRoom from './ParentRoom';
import ParentRoomWithEndpointData from './ParentRoomWithEndpointData';

type ParentRoomWithDataProps = {
	room: IRoom;
};

const ParentRoomWithData = ({ room }: ParentRoomWithDataProps): ReactElement => {
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
