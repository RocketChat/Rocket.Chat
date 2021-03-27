import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';
import RoomLinkList from './RoomLinkList';

const RemoveUsersSecondStep = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms,
	keptRooms,
	username,
	rooms,
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
			<Margins blockEnd='x16'>
				{/* {(Object.values(deletedRooms).length > 0 || Object.values(keptRooms).length > 0) && <Box>{ username } is the last owner of some Channels, once removed from the Team, the Channel will be kept inside the Team but the member will still be responsible for managing the Channel from outside the Team.</Box>} */}

				{/* {Object.values(deletedRooms).length > 0 && <Box>{ username } is not going to be removed from the following Channels: <RoomLinkList rooms={deletedRooms} /> </Box>} */}

				{Object.values(keptRooms).length > 0 ? (
					<Box>
						{t('Teams_kept_username_channels', { username })} <RoomLinkList rooms={keptRooms} />
					</Box>
				) : (
					<Box>{t('Teams_removing_user_from_team_and_channels', { username })}</Box>
				)}
			</Margins>
		</GenericModal>
	);
};

export default RemoveUsersSecondStep;
