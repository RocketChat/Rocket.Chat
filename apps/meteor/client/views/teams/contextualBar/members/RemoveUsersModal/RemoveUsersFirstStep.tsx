import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';
import ChannelDesertionTable from '../../../ChannelDesertionTable';

type RemoveUsersFirstStepProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	onToggleAllRooms: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom> & { isLastOwner?: boolean }) => void;
	selectedRooms: { [key: string]: Serialized<IRoom> };
	eligibleRoomsLength: number | undefined;
};

const RemoveUsersFirstStep = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	onToggleAllRooms,
	onChangeRoomSelection,
	selectedRooms,
	eligibleRoomsLength,
	...props
}: RemoveUsersFirstStepProps) => {
	const { t } = useTranslation();

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
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
				eligibleRoomsLength={eligibleRoomsLength}
			/>
		</GenericModal>
	);
};

export default RemoveUsersFirstStep;
