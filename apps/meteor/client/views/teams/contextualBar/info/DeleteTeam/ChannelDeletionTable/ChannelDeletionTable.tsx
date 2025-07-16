import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ChannelDeletionTableRow from './ChannelDeletionTableRow';
import { GenericTable, GenericTableHeaderCell, GenericTableBody, GenericTableHeader } from '../../../../../../components/GenericTable';
import { useSort } from '../../../../../../components/GenericTable/hooks/useSort';

type ChannelDeletionTableProps = {
	rooms: Serialized<IRoom>[];
	onToggleAllRooms: () => void;
	onChangeRoomSelection: (room: Serialized<IRoom>) => void;
	selectedRooms: { [key: string]: Serialized<IRoom> };
};

const ChannelDeletionTable = ({ rooms, onChangeRoomSelection, selectedRooms, onToggleAllRooms }: ChannelDeletionTableProps) => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount'>('name');

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const getSortedChannels = () => {
		if (rooms) {
			const sortedRooms = [...rooms];
			if (sortBy === 'name') {
				sortedRooms.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
			}
			if (sortBy === 'usersCount') {
				sortedRooms.sort((a, b) => a.usersCount - b.usersCount);
			}
			if (sortDirection === 'desc') {
				return sortedRooms?.reverse();
			}
			return sortedRooms;
		}
	};

	const sortedRooms = getSortedChannels();

	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;

	const headers = (
		<>
			<GenericTableHeaderCell key='name' sort='name' onClick={setSort} direction={sortDirection} active={sortBy === 'name'}>
				<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms} />
				<Box mi={8}>{t('Channel_name')}</Box>
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='usersCount'
				sort='usersCount'
				onClick={setSort}
				direction={sortDirection}
				active={sortBy === 'usersCount'}
			>
				<Box width='100%' textAlign='end'>
					{t('Members')}
				</Box>
			</GenericTableHeaderCell>
		</>
	);

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs={24}>
			<GenericTable>
				<GenericTableHeader>{headers}</GenericTableHeader>
				<GenericTableBody>
					{sortedRooms?.map((room) => (
						<ChannelDeletionTableRow room={room} key={room._id} onChange={onChangeRoomSelection} selected={!!selectedRooms[room._id]} />
					))}
				</GenericTableBody>
			</GenericTable>
		</Box>
	);
};

export default ChannelDeletionTable;
