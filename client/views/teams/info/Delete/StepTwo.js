import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import ChannelDeletionTable from './ChannelDeletionTable';
import { useTranslation } from '../../../../contexts/TranslationContext';

export const StepTwo = ({
	rooms,
	// params,
	// onChangeParams,
	onToggleAllRooms,
	onChangeRoomSelection,
	onConfirm,
	onClose,
	onCancel,
	selectedRooms,
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		title={t('Teams_about_the_channels')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onClose}
		confirmText={t('Continue')}
	>
		{t('Teams_delete_team_choose_channels')}
		<ChannelDeletionTable
			onToggleAllRooms={onToggleAllRooms}
			rooms={rooms}
			params={{}}
			onChangeParams={() => {}}
			onChangeRoomSelection={onChangeRoomSelection}
			selectedRooms={selectedRooms}
		/>
	</GenericModal>;
};

export default StepTwo;
