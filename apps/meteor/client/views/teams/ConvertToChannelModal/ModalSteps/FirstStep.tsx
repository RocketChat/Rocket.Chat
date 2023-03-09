import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import ChannelDesertionTable from '../../ChannelDesertionTable';

type FirstStepProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: () => void;
	onToggleAllRooms: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom>) => void;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	eligibleRoomsLength: number | undefined;
	selectedRooms: { [key: string]: Serialized<IRoom> };
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
			<Box mbe='x24' fontScale='p2'>
				{t('Select_the_teams_channels_you_would_like_to_delete')}
			</Box>

			<Box mbe='x24' fontScale='p2'>
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
