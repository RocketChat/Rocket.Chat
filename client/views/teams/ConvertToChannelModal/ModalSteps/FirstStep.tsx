import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';
import ChannelDesertionTable from '../../ChannelDesertionTable';

type FirstStepProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
	onToggleAllRooms: () => void;
	onChangeRoomSelection: (room: IRoom) => void;
	rooms: Array<IRoom & { isLastOwner?: string }> | undefined;
	eligibleRoomsLength: number | undefined;
	selectedRooms: { [key: string]: IRoom };
};

const FirstStep: FC<FirstStepProps> = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	onToggleAllRooms,
	onChangeRoomSelection,
	selectedRooms,
	eligibleRoomsLength,
	...props
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon='warning'
			title={t('Converting_team_to_channel')}
			cancelText={t('Cancel')}
			confirmText={t('Continue')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
			{...props}
		>
			<Box mbe='x24' fontScale='p1'>
				{t('Select_the_teams_channels_you_would_like_to_delete')}
			</Box>

			<Box mbe='x24' fontScale='p1'>
				{t('Notice_that_public_channels_will_be_public_and_visible_to_everyone')}
			</Box>

			<ChannelDesertionTable
				lastOwnerWarning={undefined}
				onToggleAllRooms={onToggleAllRooms}
				rooms={rooms}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
				eligibleRoomsLength={eligibleRoomsLength}
			/>
		</GenericModal>
	);
};

export default FirstStep;
