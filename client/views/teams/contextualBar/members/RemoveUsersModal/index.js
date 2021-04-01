import React, { useMemo } from 'react';
import { Skeleton } from '@rocket.chat/fuselage';

import { useEndpointData } from '../../../../../hooks/useEndpointData';
import BaseRemoveUsersModal from './RemoveUsersModal';
import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../lib/asyncState';

const initialData = { user: { username: '' } };

const RemoveUsersModal = ({ teamId, userId, onClose, onCancel, onConfirm }) => {
	const t = useTranslation();
	const { value, phase } = useEndpointData('teams.listRoomsOfUser', useMemo(() => ({ teamId, userId }), [teamId, userId]));
	const userDataFetch = useEndpointData('users.info', useMemo(() => ({ userId }), [userId]), initialData);
	const { user: { username } } = userDataFetch?.value;

	if (phase === AsyncStatePhase.LOADING) {
		return <GenericModal
			variant='warning'
			onClose={onClose}
			title={<Skeleton width='50%'/>}
			confirmText={<Skeleton width='full'/>}
			confirmText={t('Cancel')}
			onConfirm={onClose}
		>
			<Skeleton width='full'/>
		</GenericModal>;
	}

	return <BaseRemoveUsersModal
		onClose={onClose}
		username={username}
		onCancel={onCancel}
		onConfirm={onConfirm}
		rooms={value?.rooms}
	/>;
};

export default RemoveUsersModal;
