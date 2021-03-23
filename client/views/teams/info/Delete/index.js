import React, { useMemo } from 'react';

import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }) => {
	const { value } = useEndpointData('teams.listRooms', useMemo(() => ({ teamId }), [teamId]));

	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export { StepOne, StepTwo, StepThree };

export default DeleteTeamModalWithRooms;
