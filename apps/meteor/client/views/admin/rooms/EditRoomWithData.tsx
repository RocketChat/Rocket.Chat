import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarSkeleton,
} from '../../../components/Contextualbar';
import EditRoom from './EditRoom';

type EditRoomWithDataProps = { rid?: IRoom['_id']; onReload: () => void };

const EditRoomWithData = ({ rid, onReload }: EditRoomWithDataProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms.getRoom');

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
		return <ContextualbarSkeleton />;
	}

	const handleChange = (): void => {
		refetch();
		onReload();
	};

	const handleDelete = (): void => {
		onReload();
	};

	return data ? (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/admin/rooms')} />
			</ContextualbarHeader>
			<EditRoom room={data} onChange={handleChange} onDelete={handleDelete} />
		</Contextualbar>
	) : null;
};

export default EditRoomWithData;
