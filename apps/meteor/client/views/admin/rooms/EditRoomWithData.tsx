import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import React from 'react';

import EditRoom from './EditRoom';

const EditRoomWithData: FC<{ rid?: string; onReload: () => void }> = ({ rid, onReload }) => {
	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms.getRoom');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, refetch } = useQuery(
		['rooms', rid, 'admin'],
		async () => {
			const rooms = await getAdminRooms({ rid });
			return rooms;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	if (isLoading) {
		return (
			<Box w='full' p={24}>
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
				<Skeleton mbe={4} />
				<Skeleton mbe={8} />
			</Box>
		);
	}

	const handleChange = (): void => {
		refetch();
		onReload();
	};

	const handleDelete = (): void => {
		onReload();
	};

	return data ? <EditRoom room={data} onChange={handleChange} onDelete={handleDelete} /> : null;
};

export default EditRoomWithData;
