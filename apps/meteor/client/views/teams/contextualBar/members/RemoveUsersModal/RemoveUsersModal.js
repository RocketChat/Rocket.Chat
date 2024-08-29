import React, { useMemo } from 'react';

import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import BaseRemoveUsersModal from './BaseRemoveUsersModal';

const initialData = { user: { username: '' } };

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }) => {
	const { value, phase } = useEndpointData('/v1/teams.listRoomsOfUser', { params: useMemo(() => ({ teamId, userId }), [teamId, userId]) });
	const userDataFetch = useEndpointData('/v1/users.info', { params: useMemo(() => ({ userId }), [userId]), initialValue: initialData });
	const {
		user: { username },
	} = userDataFetch?.value;

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModalSkeleton />;
	}

	return <BaseRemoveUsersModal onClose={onClose} username={username} onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export default RemoveUsersModal;
