import type { ITeam } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useUserId, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import LeaveTeamModal from './LeaveTeamModal/LeaveTeamModal';

type LeaveTeamWithDataProps = {
	teamId: ITeam['_id'];
	onCancel: () => void;
	onConfirm: () => void;
};

const LeaveTeamWithData = ({ teamId, onCancel, onConfirm }: LeaveTeamWithDataProps): ReactElement => {
	const t = useTranslation();
	const userId = useUserId();

	if (!userId) {
		throw Error('No user found');
	}

	const getRoomsOfUser = useEndpoint('GET', '/v1/teams.listRoomsOfUser');
	const { data, isLoading } = useQuery(['teams.listRoomsOfUser'], () => getRoomsOfUser({ teamId, userId }));

	if (isLoading) {
		return (
			<GenericModal variant='warning' onClose={onCancel} onConfirm={onCancel} title={<Skeleton width='50%' />} confirmText={t('Cancel')}>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={data?.rooms || []} />;
};

export default LeaveTeamWithData;
