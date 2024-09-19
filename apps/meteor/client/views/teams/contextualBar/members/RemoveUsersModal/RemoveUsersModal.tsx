import type { IRoom, IUser } from '@rocket.chat/core-typings';
import React, { useMemo } from 'react';

import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import BaseRemoveUsersModal from './BaseRemoveUsersModal';

type RemoveUsersModalProps = {
	teamId: IRoom['teamId'];
	userId: IUser['_id'];
	onClose?: () => void;
	onCancel?: () => void;
	onConfirm?: () => void;
};

const initialData = { user: { username: '' } };

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }: RemoveUsersModalProps) => {
	const { value, phase } = useEndpointData('/v1/teams.listRoomsOfUser', { params: useMemo(() => ({ teamId, userId }), [teamId, userId]) });
	const { value: userInfoValue } = useEndpointData('/v1/users.info', {
		params: useMemo(() => ({ userId }), [userId]),
		initialValue: initialData,
	});

	const username = userInfoValue?.user?.username;

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModalSkeleton />;
	}

	return (
		<BaseRemoveUsersModal
			onClose={onClose}
			username={username || ''}
			onCancel={onCancel}
			onConfirm={onConfirm}
			rooms={value?.rooms || []}
		/>
	);
};

export default RemoveUsersModal;
