import type { IRoom } from '@rocket.chat/core-typings';
import { HeaderTagSkeleton } from '@rocket.chat/ui-client';
import React from 'react';

import ParentRoom from './ParentRoom';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';

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

	return <ParentRoom room={data.room} />;
};

export default ParentRoomWithEndpointData;
