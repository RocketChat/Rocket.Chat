import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import ChannelDeletionTable from './ChannelDeletionTable';

export const StepTwo = ({
	rooms,
	// params,
	// onChangeParams,
	onToggleAllRooms,
	onChangeRoomSelection,
	onConfirm,
	onCancel,
	selectedRooms,
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Teams_about_the_channels')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Continue')}
		>
			<Box withRichContent mbe='x16'>
				<Box is='span' color='danger' fontWeight='bold'>
					{t('Team_Delete_Channel_modal_content_danger')}
				</Box>{' '}
				{t('Teams_delete_team_Warning')}
			</Box>
			<Box>
				{t('Teams_delete_team_choose_channels')} {t('Teams_delete_team_public_notice')}
			</Box>
			<ChannelDeletionTable
				onToggleAllRooms={onToggleAllRooms}
				rooms={rooms}
				params={{}}
				onChangeParams={() => {}}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
			/>
		</GenericModal>
	);
};

export default StepTwo;
