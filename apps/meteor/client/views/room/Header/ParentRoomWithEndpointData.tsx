import type { IRoom } from '@rocket.chat/core-typings';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';
import ParentRoom from './ParentRoom';

type ParentRoomWithEndpointDataProps = {
	rid: IRoom['_id'];
};

const ParentRoomWithEndpointData = ({ rid }: ParentRoomWithEndpointDataProps): ReactElement | null => {
	const { data, isLoading, isError } = useRoomInfoEndpoint(rid);

	if (isLoading) {
		return <Header.Tag.Skeleton />;
	}

	if (isError || !data?.room) {
		return null;
	}

	return <ParentRoom room={data.room} />;
};

export default ParentRoomWithEndpointData;
