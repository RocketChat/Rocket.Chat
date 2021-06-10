import { Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserId } from '../../../../../contexts/UserContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import LeaveTeamModal from './LeaveTeamModal';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

const LeaveTeamModalWithRooms = ({ teamId, onCancel, onConfirm }) => {
	const t = useTranslation();

	const userId = useUserId();
	const { value, phase } = useEndpointData(
		'teams.listRoomsOfUser',
		useMemo(() => ({ teamId, userId }), [teamId, userId]),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal
				variant='warning'
				onClose={onCancel}
				onConfirm={onCancel}
				title={<Skeleton width='50%' />}
				confirmText={t('Cancel')}
			>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value.rooms} />;
};

export { StepOne, StepTwo };

export default LeaveTeamModalWithRooms;
