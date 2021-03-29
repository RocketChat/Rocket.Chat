import React, { useMemo } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import BaseRemoveUsersModal from './BaseRemoveUsersModal';

const RemoveUsersModalWithRooms = ({ teamId, userId, username, onClose, onCancel, onConfirm }) => {
	const { value } = useEndpointData(
		'teams.listRoomsOfUser',
		useMemo(() => ({ teamId, userId }), [teamId, userId]),
	);

	return (
		<BaseRemoveUsersModal
			onClose={onClose}
			username={username}
			onCancel={onCancel}
			onConfirm={onConfirm}
			rooms={value?.rooms}
		/>
	);
};

export default RemoveUsersModalWithRooms;
