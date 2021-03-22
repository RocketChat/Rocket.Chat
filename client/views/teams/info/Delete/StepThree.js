import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import RoomLinkList from '../RoomLinkList';
import { useTranslation } from '../../../../contexts/TranslationContext';

export const StepThree = ({ deletedRooms, keptRooms, onConfirm, onClose, onCancel }) => {
	const t = useTranslation();

	return <GenericModal
		variant='danger'
		icon='trash'
		title={t('Deleting')}
		onConfirm={() => onConfirm(Object.values(deletedRooms).map(({ _id }) => _id))}
		onCancel={onCancel}
		confirmText={t('Remove')}
		cancelText={t('Back')}
		onClose={onClose}
	>
		<p>{t('Teams_delete_team')}</p>
		{!!Object.values(deletedRooms).length && <>
			<br />
			<p>
				{t('Teams_deleted_channels')}{' '}
				<RoomLinkList rooms={deletedRooms}/>
			</p>
		</>}
		{!!Object.values(keptRooms).length && <>
			<br />
			<p>
				{t('Teams_kept_channels')}{' '}
				<RoomLinkList rooms={keptRooms}/>
			</p>
		</>}

	</GenericModal>;
};

export default StepThree;
