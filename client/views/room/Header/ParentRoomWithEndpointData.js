import { Skeleton } from '@rocket.chat/fuselage';
import React, { useEffect } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { AsyncStatePhase, useAsyncState } from '../../../hooks/useAsyncState';
import ParentRoom from './ParentRoom';

const ParentRoomWithEndpointData = ({ rid }) => {
	const { resolve, reject, reset, phase, value } = useAsyncState();
	const getData = useEndpoint('GET', 'rooms.info');

	useEffect(() => {
		(async () => {
			reset();
			getData({ roomId: rid })
				.then(resolve)
				.catch((error) => {
					reject(error);
				});
		})();
	}, [reset, getData, rid, resolve, reject]);

	if (AsyncStatePhase.LOADING === phase) {
		return <Skeleton width='x48' />;
	}

	if (AsyncStatePhase.ERROR === phase || !value?.room) {
		return null;
	}

	return <ParentRoom room={value.room} />;
};

export default ParentRoomWithEndpointData;
