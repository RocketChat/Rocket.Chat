import { Box, CheckBox } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

<<<<<<< HEAD:client/views/teams/contextualBar/info/Delete/ChannelDeletionTable.js
import GenericTable from '../../../../../components/GenericTable';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import ChannelRow from './ChannelRow';

const ChannelDeletionTable = ({
=======
import { IRoom } from '../../../definition/IRoom';
import GenericTable from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import ChannelRow from './contextualBar/ChannelRow';

type ChannelDesertionTableProps = {
	lastOwnerWarning: boolean | undefined;
	rooms: Array<IRoom & { isLastOwner?: string }> | undefined;
	eligibleRoomsLength: number | undefined;
	params?: {};
	onChangeParams?: () => void;
	onChangeRoomSelection: (room: IRoom) => void;
	selectedRooms: { [key: string]: IRoom };
	onToggleAllRooms: () => void;
};

const ChannelDesertionTable: FC<ChannelDesertionTableProps> = ({
>>>>>>> Added the Out of Office Post Message Handler:client/views/teams/ChannelDesertionTable.tsx
	rooms,
	params,
	onChangeParams,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
}) => {
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

<<<<<<< HEAD:client/views/teams/contextualBar/info/Delete/ChannelDeletionTable.js
	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;
=======
	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate =
		eligibleRoomsLength && eligibleRoomsLength > selectedRoomsLength
			? selectedRoomsLength > 0
			: false;

	const formatDate = useFormatDateAndTime();
>>>>>>> Added the Out of Office Post Message Handler:client/views/teams/ChannelDesertionTable.tsx

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs='x24'>
			<GenericTable
				header={
					<>
						<GenericTable.HeaderCell key='name' sort='name'>
							<CheckBox
								indeterminate={indeterminate}
								checked={checked}
								onChange={onToggleAllRooms}
							/>
							<Box mi='x8'>{t('Channel_name')}</Box>
						</GenericTable.HeaderCell>
						<GenericTable.HeaderCell key='usersCount' sort='usersCount'>
							<Box width='100%' textAlign='end'>
								{t('Members')}
							</Box>
						</GenericTable.HeaderCell>
					</>
				}
				results={rooms}
				params={params}
				setParams={onChangeParams}
				fixed={false}
				pagination={false}
			>
<<<<<<< HEAD:client/views/teams/contextualBar/info/Delete/ChannelDeletionTable.js
				{({ key, ...room }) => (
=======
				{(room: IRoom, key: string): ReactElement => (
>>>>>>> Added the Out of Office Post Message Handler:client/views/teams/ChannelDesertionTable.tsx
					<ChannelRow
						room={room}
						key={key}
						onChange={onChangeRoomSelection}
						selected={!!selectedRooms[room._id]}
					/>
				)}
			</GenericTable>
		</Box>
	);
};

export default ChannelDeletionTable;
