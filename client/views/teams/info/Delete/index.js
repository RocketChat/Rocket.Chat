import React, { useState, useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';

const DeleteTeamModalWithRooms = ({ teamId, onClose, onCancel }) => {
	const { value, phase, error } = useEndpointData('teams.listRooms', useMemo(() => ({ teamId }), [teamId]));

	console.log({
		value,
		phase,
		error,
	});

	return <DeleteTeamModal onClose={onClose} onCancel={onCancel} rooms={value?.rooms} />;
};

export { StepOne, StepTwo, StepThree };

export default DeleteTeamModalWithRooms;
