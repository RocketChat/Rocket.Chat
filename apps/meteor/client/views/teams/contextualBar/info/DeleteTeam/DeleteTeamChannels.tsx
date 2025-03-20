import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ChannelDeletionTable from './ChannelDeletionTable';
import GenericModal from '../../../../../components/GenericModal';

type DeleteTeamChannelsProps = {
	rooms: Serialized<IRoom>[];
	onCancel: () => void;
	selectedRooms: { [key: string]: Serialized<IRoom> };
	onToggleAllRooms: () => void;
	onConfirm: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom>) => void;
};

const DeleteTeamChannels = ({
	rooms,
	onCancel,
	selectedRooms,
	onToggleAllRooms,
	onConfirm,
	onChangeRoomSelection,
}: DeleteTeamChannelsProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Teams_about_the_channels')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Continue')}
		>
			<Box withRichContent mbe={16}>
				<Box is='span' color='status-font-on-danger' fontWeight='bold'>
					{t('Team_Delete_Channel_modal_content_danger')}{' '}
				</Box>
				{t('Teams_delete_team_Warning')}
			</Box>
			<Box>
				{t('Teams_delete_team_choose_channels')} {t('Teams_delete_team_public_notice')}
			</Box>
			<ChannelDeletionTable
				rooms={rooms}
				onToggleAllRooms={onToggleAllRooms}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
			/>
		</GenericModal>
	);
};

export default DeleteTeamChannels;
