import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditRoom from './EditRoom';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarSkeleton,
} from '../../../components/Contextualbar';

type EditRoomWithDataProps = { rid?: IRoom['_id']; onReload: () => void; onClose: () => void };

const EditRoomWithData = ({ rid, onReload, onClose }: EditRoomWithDataProps) => {
	const { t } = useTranslation();

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
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<EditRoom room={data as IRoom} onChange={handleChange} onDelete={handleDelete} onClose={onClose} />
		</Contextualbar>
	) : null;
};

export default EditRoomWithData;
