import { Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import BaseRemoveUsersModal from './BaseRemoveUsersModal';

const initialData = { user: { username: '' } };

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }) => {
	const t = useTranslation();
	const { value, phase } = useEndpointData(
		'teams.listRoomsOfUser',
		useMemo(() => ({ teamId, userId }), [teamId, userId]),
	);
	const userDataFetch = useEndpointData(
		'users.info',
		useMemo(() => ({ userId }), [userId]),
		initialData,
	);
	const {
		user: { username },
	} = userDataFetch?.value;

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal variant='warning' onClose={onClose} title={<Skeleton width='50%' />} confirmText={t('Cancel')} onConfirm={onClose}>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	return <BaseRemoveUsersModal onClose={onClose} username={username} onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export default RemoveUsersModal;
