import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import React, { useMemo } from 'react';

import GenericModalSkeleton from '../../../../../components/GenericModal/GenericModalSkeleton';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import BaseRemoveUsersModal from './BaseRemoveUsersModal';

type RemoveUsersModalProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	teamId: string;
	userId: string;
};

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }: RemoveUsersModalProps) => {
	const { value, phase } = useEndpointData('/v1/teams.listRoomsOfUser', { params: useMemo(() => ({ teamId, userId }), [teamId, userId]) });
	const { value: userData } = useEndpointData('/v1/users.info', { params: useMemo(() => ({ userId }), [userId]) });

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModalSkeleton />;
	}

	return (
		<BaseRemoveUsersModal
			onClose={onClose}
			username={userData?.user.username ?? ''}
			onCancel={onCancel}
			onConfirm={onConfirm}
			rooms={value?.rooms ?? []}
		/>
	);
};

export default RemoveUsersModal;
