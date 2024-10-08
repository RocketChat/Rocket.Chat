import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';

const RemoveUsersSecondStep = ({ onClose, onCancel, onConfirm, deletedRooms = {}, username, rooms = [], ...props }) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='danger'
			icon={<Icon name='modal-warning' size='x24' color='status-font-on-warning' />}
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Remove')}
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={() => onConfirm(deletedRooms)}
			{...props}
		>
			{t('Teams_removing__username__from_team', { username })}
		</GenericModal>
	);
};

export default RemoveUsersSecondStep;
