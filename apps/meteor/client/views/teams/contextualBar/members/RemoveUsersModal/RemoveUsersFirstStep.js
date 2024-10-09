import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import ChannelDesertionTable from '../../../ChannelDesertionTable';

const RemoveUsersFirstStep = ({
	onClose,
	onCancel,
	onConfirm,
	username,
	results,
	rooms,
	// params,
	// onChangeParams,
	onToggleAllRooms,
	onChangeRoomSelection,
	selectedRooms,
	// onChangeParams={(...args) => console.log(args)}
	eligibleRoomsLength,
	...props
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon='warning'
			title={t('Teams_removing_member')}
			cancelText={t('Cancel')}
			confirmText={t('Continue')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			{...props}
		>
			<Box mbe={24} fontScale='p2'>
				{t('Select_the_channels_you_want_the_user_to_be_removed_from')}
			</Box>
			<ChannelDesertionTable
				lastOwnerWarning={t('Teams_channels_last_owner_leave_channel_warning')}
				onToggleAllRooms={onToggleAllRooms}
				rooms={rooms}
				params={{}}
				onChangeParams={() => {}}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
				eligibleRoomsLength={eligibleRoomsLength}
			/>
		</GenericModal>
	);
};

export default RemoveUsersFirstStep;
