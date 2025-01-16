import type { ITeam } from '@rocket.chat/core-typings';
import { useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import LeaveTeamModal from './LeaveTeamModal/LeaveTeamModal';
import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';

type LeaveTeamWithDataProps = {
	teamId: ITeam['_id'];
	onCancel: () => void;
	onConfirm: () => void;
};

const LeaveTeamWithData = ({ teamId, onCancel, onConfirm }: LeaveTeamWithDataProps): ReactElement => {
	const userId = useUserId();

	if (!userId) {
		throw Error('No user found');
	}

	const getRoomsOfUser = useEndpoint('GET', '/v1/teams.listRoomsOfUser');
	const { data, isLoading } = useQuery({
		queryKey: ['teams.listRoomsOfUser'],
		queryFn: () => getRoomsOfUser({ teamId, userId }),
	});

	if (isLoading) {
		return <GenericModalSkeleton />;
	}

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={data?.rooms || []} />;
};

export default LeaveTeamWithData;
