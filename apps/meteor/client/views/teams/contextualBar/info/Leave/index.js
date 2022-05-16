import { Skeleton } from '@rocket.chat/fuselage';
import { useUserId, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useCallback } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useAsyncState } from '../../../../../hooks/useAsyncState';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import LeaveTeamModal from './LeaveTeamModal';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

const LeaveTeamModalWithRooms = ({ teamId, onCancel, onConfirm }) => {
	const t = useTranslation();

	const userId = useUserId();

	const listRooms = useEndpoint('GET', 'teams.listRoomsOfUser');
	const { resolve, reject, reset, phase, value } = useAsyncState([]);

	const fetchData = useCallback(() => {
		reset();
		listRooms({ teamId, userId })
			.then(resolve)
			.catch((error) => {
				console.error(error);
				reject(error);
			});
	}, [reset, listRooms, teamId, userId, resolve, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal variant='warning' onClose={onCancel} onConfirm={onCancel} title={<Skeleton width='50%' />} confirmText={t('Cancel')}>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms || []} />;
};

export { StepOne, StepTwo };

export default LeaveTeamModalWithRooms;
