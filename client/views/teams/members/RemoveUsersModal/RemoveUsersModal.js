import { Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import GenericModal from '../../../../components/GenericModal';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import RemoveUsersModalWithRooms from './RemoveUsersModalWithRooms';
import RemoveUsersSecondStep from './RemoveUsersSecondStep';

const initialData = { user: { username: '' } };

const RemoveUsersModal = (props) => {
	const t = useTranslation();

	const { userId } = props;

	const canViewUserRooms = usePermission('view-all-team-channels');

	const { value, phase } = useEndpointData(
		'users.info',
		useMemo(() => ({ userId }), [userId]),
		initialData,
	);

	const {
		user: { username },
	} = value;

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal
				variant='warning'
				onClose={props.onClose}
				title={<Skeleton width='50%' />}
				confirmText={<Skeleton width='full' />}
				confirmText={t('Cancel')}
				onConfirm={props.onClose}
			>
				<Skeleton width='full' />
			</GenericModal>
		);
	}

	if (canViewUserRooms) {
		return <RemoveUsersModalWithRooms {...props} username={username} />;
	}

	return <RemoveUsersSecondStep {...props} username={username} />;
};

export default RemoveUsersModal;
