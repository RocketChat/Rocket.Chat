import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import DeleteTeamModal from './DeleteTeamModal';
import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';

type DeleteTeamModalWithRoomsProps = {
	teamId: string;
	onConfirm: (roomsToDelete: IRoom['_id'][]) => void;
	onCancel: () => void;
};

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }: DeleteTeamModalWithRoomsProps): ReactElement => {
	const query = useMemo(() => ({ teamId }), [teamId]);
	const getTeamsListRooms = useEndpoint('GET', '/v1/teams.listRooms');
	const { data, isLoading } = useQuery({
		queryKey: ['getTeamsListRooms', query],
		queryFn: async () => getTeamsListRooms(query),
	});

	if (isLoading) {
		return <GenericModalSkeleton />;
	}
	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={data?.rooms || []} />;
};

export default DeleteTeamModalWithRooms;
