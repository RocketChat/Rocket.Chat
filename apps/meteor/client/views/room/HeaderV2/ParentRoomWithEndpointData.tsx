import type { IRoom } from '@rocket.chat/core-typings';
import React from 'react';

import { HeaderTagSkeleton } from '../../../components/Header';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import ParentRoom from './ParentRoom';
import ParentTeam from './ParentTeam';

type ParentRoomWithEndpointDataProps = {
	rid: IRoom['_id'];
};

const ParentRoomWithEndpointData = ({ rid }: ParentRoomWithEndpointDataProps) => {
	const { data, isLoading, isError } = useRoomInfoEndpoint(rid);

	if (isLoading) {
		return <HeaderTagSkeleton />;
	}

	if (isError || !data?.room) {
		return null;
	}

	if (data.parent) {
		return <ParentRoom room={data.parent} />;
	}

	if (data.team) {
		if (data.team.roomId === rid) {
			return null;
		}

		return <ParentTeam team={data.team} />;
	}

	return <ParentRoom room={data.room} />;
};

export default ParentRoomWithEndpointData;
