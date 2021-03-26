import React, { useMemo } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';
import StepOne from './StepOne';
import StepThree from './StepThree';
import StepTwo from './StepTwo';

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }) => {
	const { value } = useEndpointData(
		'teams.listRooms',
		useMemo(() => ({ teamId }), [teamId]),
	);

	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export { StepOne, StepTwo, StepThree };

export default DeleteTeamModalWithRooms;
