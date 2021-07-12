import { Box, CheckBox } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

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
	rooms,
	eligibleRoomsLength,
	params,
	onChangeParams,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
	lastOwnerWarning,
}) => {
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate =
		eligibleRoomsLength && eligibleRoomsLength > selectedRoomsLength
			? selectedRoomsLength > 0
			: false;

	const formatDate = useFormatDateAndTime();

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
						<GenericTable.HeaderCell key='joinedAt' sort='joinedAt'>
							<Box width='100%' textAlign='end'>
								{t('Joined_at')}
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
				{(room: IRoom, key: string): ReactElement => (
					<ChannelRow
						formatDate={formatDate}
						room={room}
						key={key}
						onChange={onChangeRoomSelection}
						selected={!!selectedRooms[room._id]}
						lastOwnerWarning={lastOwnerWarning}
					/>
				)}
			</GenericTable>
		</Box>
	);
};

export default ChannelDesertionTable;
