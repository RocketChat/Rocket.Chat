import { Skeleton, Callout } from '@rocket.chat/fuselage';
import React, { useContext, useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { UserContext } from '../../../../../contexts/UserContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import LeaveTeamModal from './LeaveTeamModal';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

const LeaveTeamModalWithRooms = ({ teamId, onCancel, onConfirm }) => {
	const t = useTranslation();
	const { userId } = useContext(UserContext);

	const { value, phase, error } = useEndpointData(
		'teams.listRoomsOfUser',
		useMemo(() => ({ teamId, userId }), [teamId, userId]),
	);

	if (error) {
		return (
			<GenericModal variant='warning' onClose={onCancel} title={t('Error')}>
				<Callout title={error?.message} type='warning' />
			</GenericModal>
		);
	}

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal
				variant='warning'
				onClose={onCancel}
				title={<Skeleton width='50%' />}
				confirmText={<Skeleton width='full' />}
			>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	return <LeaveTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export { StepOne, StepTwo };

export default LeaveTeamModalWithRooms;
