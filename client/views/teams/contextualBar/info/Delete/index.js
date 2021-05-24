import React, { useMemo } from 'react';

import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';
import DeleteTeamSkeleton from './DeleteTeamSkeleton';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }) => {
	const { value, phase } = useEndpointData(
		'teams.listRooms',
		useMemo(() => ({ teamId }), [teamId]),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return <DeleteTeamSkeleton onClose={onCancel} />;
	}

	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export { StepOne, StepTwo };

export default DeleteTeamModalWithRooms;
