import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import RoomLinkList from './RoomLinkList';
import { useTranslation } from '../../../../contexts/TranslationContext';

export const StepThree = ({ deletedRooms, keptRooms, onConfirm, onCancel }) => {
	const t = useTranslation();

	return <GenericModal
		variant='danger'
		icon='trash'
		title={t('Deleting')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		confirmText={t('Remove')}
		cancelText={t('Back')}
	>
		<p>{t('Teams_delete_team')}</p>
		<p>
			{t('Teams_deleted_channels')}{' '}
			<RoomLinkList rooms={deletedRooms}/>
		</p>
		<p>
			{t('Teams_kept_channels')}{' '}
			<RoomLinkList rooms={keptRooms}/>
		</p>

	</GenericModal>;
};

export default StepThree;
