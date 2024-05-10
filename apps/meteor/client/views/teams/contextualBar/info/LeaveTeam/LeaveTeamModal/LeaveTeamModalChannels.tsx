import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../../../../../components/GenericModal';
import ChannelDesertionTable from '../../../../ChannelDesertionTable';

type LeaveTeamModalChannelsProps = {
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	onToggleAllRooms: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom> & { isLastOwner?: boolean }) => void;
	onConfirm: () => void;
	onCancel: () => void;
	eligibleRoomsLength: number;
	selectedRooms: {
		[key: string]: Serialized<IRoom> & { isLastOwner?: boolean };
	};
};

const LeaveTeamModalChannels = ({
	rooms,
	onToggleAllRooms,
	onChangeRoomSelection,
	onConfirm,
	onCancel,
	eligibleRoomsLength,
	selectedRooms,
}: LeaveTeamModalChannelsProps): ReactElement => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Teams_leave')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Continue')}
		>
			{t('Teams_leave_channels')}
			<ChannelDesertionTable
				rooms={rooms}
				lastOwnerWarning={t('Teams_channels_last_owner_leave_channel_warning')}
				onToggleAllRooms={onToggleAllRooms}
				eligibleRoomsLength={eligibleRoomsLength}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
			/>
		</GenericModal>
	);
};

export default LeaveTeamModalChannels;
