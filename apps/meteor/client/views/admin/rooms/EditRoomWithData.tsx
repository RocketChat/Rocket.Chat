import type { IRoom } from '@rocket.chat/core-typings';
import { ContextualbarHeader, ContextualbarTitle, ContextualbarClose, ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditRoom from './EditRoom';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export type EditRoomWithDataProps = { rid?: IRoom['_id']; onClose: () => void };

const EditRoomWithData = ({ rid, onClose }: EditRoomWithDataProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const getAdminRooms = useEndpoint('GET', '/v1/rooms.adminRooms.getRoom');

	const { data, isPending, refetch } = useQuery({
		queryKey: ['rooms', rid, 'admin'],
		queryFn: async () => {
			const rooms = await getAdminRooms({ rid });
			return rooms;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	const handleChange = (): void => {
		refetch();
		queryClient.invalidateQueries({ queryKey: roomsQueryKeys.adminList() });
	};

	const handleDelete = (): void => {
		queryClient.invalidateQueries({ queryKey: roomsQueryKeys.adminList() });
	};

	return data ? (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<EditRoom room={data as IRoom} onChange={handleChange} onDelete={handleDelete} onClose={onClose} />
		</>
	) : null;
};

export default EditRoomWithData;
