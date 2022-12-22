import type { IRoom } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';

type DeleteTeamModalWithRoomsProps = {
	teamId: string;
	onConfirm: (rooms: IRoom[]) => void;
	onCancel: () => void;
};

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }: DeleteTeamModalWithRoomsProps): ReactElement => {
	const { value, phase } = useEndpointData(
		'/v1/teams.listRooms',
		useMemo(() => ({ teamId }), [teamId]),
	);

	const t = useTranslation();

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal variant='warning' onClose={onCancel} onConfirm={onCancel} title={<Skeleton width='50%' />} confirmText={t('Cancel')}>
				<Skeleton width='full' />
			</GenericModal>
		);
	}
	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export default DeleteTeamModalWithRooms;
