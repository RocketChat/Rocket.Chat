import type { IRoom } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, ReactElement } from 'react';

import { GenericTable, GenericTableHeaderCell, GenericTableHeader, GenericTableBody } from '../../../components/GenericTable';
import ChannelDesertionTableRow from './ChannelDesertionTableRow';

type ChannelDesertionTableProps = {
	lastOwnerWarning?: string;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	eligibleRoomsLength: number | undefined;
	params?: { current: number; itemsPerPage: 25 | 50 | 100 };
	onChangeParams?: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom>) => void;
	selectedRooms: { [key: string]: Serialized<IRoom> };
	onToggleAllRooms: () => void;
};

const ChannelDesertionTable: FC<ChannelDesertionTableProps> = ({
	rooms,
	eligibleRoomsLength,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
	lastOwnerWarning,
}) => {
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate = eligibleRoomsLength && eligibleRoomsLength > selectedRoomsLength ? selectedRoomsLength > 0 : false;

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs='x24'>
			<GenericTable fixed={false}>
				<GenericTableHeader>
					<GenericTableHeaderCell key='name'>
						<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms} />
						<Box mi='x8'>{t('Channel_name')}</Box>
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='joinedAt'>
						<Box width='100%' textAlign='end'>
							{t('Joined_at')}
						</Box>
					</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{rooms?.map(
						(room, key): ReactElement => (
							<ChannelDesertionTableRow
								key={key}
								room={room}
								onChange={onChangeRoomSelection}
								selected={'_id' in room && room._id ? !!selectedRooms[room._id] : false}
								lastOwnerWarning={lastOwnerWarning}
							/>
						),
					)}
				</GenericTableBody>
			</GenericTable>
		</Box>
	);
};

export default ChannelDesertionTable;
