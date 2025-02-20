import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChannelDesertionTableRow from './ChannelDesertionTableRow';
import { GenericTable, GenericTableHeaderCell, GenericTableHeader, GenericTableBody } from '../../../components/GenericTable';
import { useSort } from '../../../components/GenericTable/hooks/useSort';

type ChannelDesertionTableProps = {
	lastOwnerWarning?: string;
	rooms?: (Serialized<IRoom> & { isLastOwner?: boolean })[];
	eligibleRoomsLength: number | undefined;
	onChangeRoomSelection: (room: Serialized<IRoom>) => void;
	selectedRooms: { [key: string]: Serialized<IRoom> };
	onToggleAllRooms: () => void;
};

const ChannelDesertionTable = ({
	rooms,
	eligibleRoomsLength,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
	lastOwnerWarning,
}: ChannelDesertionTableProps) => {
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'ts'>('name');

	const { t } = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate = eligibleRoomsLength && eligibleRoomsLength > selectedRoomsLength ? selectedRoomsLength > 0 : false;

	const results = useMemo(() => {
		if (!rooms) {
			return [];
		}

		const direction = sortDirection === 'asc' ? 1 : -1;

		return rooms.sort((a, b) =>
			// eslint-disable-next-line no-nested-ternary
			a[sortBy] && b[sortBy] ? (a[sortBy]?.localeCompare(b[sortBy] ?? '') ?? 1) * direction : direction,
		);
	}, [rooms, sortBy, sortDirection]);

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs={24}>
			<GenericTable fixed={false}>
				<GenericTableHeader>
					<GenericTableHeaderCell key='name' sort='name' onClick={setSort} direction={sortDirection} active={sortBy === 'name'}>
						<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms} />
						<Box mi={8}>{t('Channel_name')}</Box>
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='ts' sort='ts' onClick={setSort} direction={sortDirection} active={sortBy === 'ts'}>
						<Box width='100%' textAlign='end'>
							{t('Joined_at')}
						</Box>
					</GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{results?.map(
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
