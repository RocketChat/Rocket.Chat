import { Icon } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const RemoveUsersSecondStep = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms = {},
	username,
	rooms = [],
	...props
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='danger'
			icon={<Icon name='modal-warning' size={24} color='warning' />}
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
