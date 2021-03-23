import React, { useMemo } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import BaseRemoveUsersModal from './RemoveUsersModal';
import { useUserData } from '../../../../hooks/useUserData';

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }) => {
	const { value } = useEndpointData('teams.listRoomsOfUser', useMemo(() => ({ teamId, userId }), [teamId, userId]));

	const { username } = useUserData(userId);

	return value?.rooms ? <BaseRemoveUsersModal
		onClose={onClose}
		username={username}
		onCancel={onCancel}
		onConfirm={onConfirm}
		rooms={value?.rooms}
	/> : null;
};

export default RemoveUsersModal;
