import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo, FC } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditRoom from './EditRoom';

const EditRoomWithData: FC<{ rid?: string; onReload: () => void }> = ({ rid, onReload }) => {
	const {
		value: data,
		phase: state,
		error,
		reload,
	} = useEndpointData(
		'rooms.adminRooms.getRoom',
		useMemo(() => ({ rid }), [rid]),
	);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box w='full' pb='x24'>
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
				<Skeleton mbe='x4' />
				<Skeleton mbe='x8' />
			</Box>
		);
	}

	if (state === AsyncStatePhase.REJECTED) {
		return <>{error?.message}</>;
	}

	const handleChange = (): void => {
		reload();
		onReload();
	};

	const handleDelete = (): void => {
		onReload();
	};

	return data ? <EditRoom room={data} onChange={handleChange} onDelete={handleDelete} /> : null;
};

export default EditRoomWithData;
