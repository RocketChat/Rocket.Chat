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
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Remove')}
			icon='info'
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
