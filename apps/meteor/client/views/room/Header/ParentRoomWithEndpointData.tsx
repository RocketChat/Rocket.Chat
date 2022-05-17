import type { IRoom } from '@rocket.chat/core-typings';
import React, { ReactElement, useMemo } from 'react';

import Header from '../../../components/Header';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import ParentRoom from './ParentRoom';

type ParentRoomWithEndpointDataProps = {
	rid: IRoom['_id'];
};

const ParentRoomWithEndpointData = ({ rid }: ParentRoomWithEndpointDataProps): ReactElement | null => {
	const { phase, value } = useEndpointData(
		'rooms.info',
		useMemo(() => ({ roomId: rid }), [rid]),
	);

	if (AsyncStatePhase.LOADING === phase) {
		return <Header.Tag.Skeleton />;
	}

	if (AsyncStatePhase.REJECTED === phase || !value?.room) {
		return null;
	}

	return <ParentRoom room={value.room} />;
};

export default ParentRoomWithEndpointData;
