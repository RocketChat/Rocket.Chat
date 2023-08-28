import type { IRoom } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import DeleteTeamModal from './DeleteTeamModal';

type DeleteTeamModalWithRoomsProps = {
	teamId: string;
	onConfirm: (roomsToDelete: IRoom['_id'][]) => void;
	onCancel: () => void;
};

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }: DeleteTeamModalWithRoomsProps): ReactElement => {
	const t = useTranslation();
	const query = useMemo(() => ({ teamId }), [teamId]);
	const getTeamsListRooms = useEndpoint('GET', '/v1/teams.listRooms');
	const { data, isLoading } = useQuery(['getTeamsListRooms', query], async () => getTeamsListRooms(query));

	if (isLoading) {
		return (
			<GenericModal variant='warning' onClose={onCancel} onConfirm={onCancel} title={<Skeleton width='50%' />} confirmText={t('Cancel')}>
				<Skeleton width='full' />
			</GenericModal>
		);
	}
	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={data?.rooms || []} />;
};

export default DeleteTeamModalWithRooms;
