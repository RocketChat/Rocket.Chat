import { Box, CheckBox } from '@rocket.chat/fuselage';
import React, { useState, useCallback } from 'react';

import GenericTable from '../../../../../components/GenericTable';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import ChannelRow from './ChannelRow';

const ChannelDeletionTable = ({
	rooms,
	params,
	onChangeParams,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
}) => {
	const [sort, setSort] = useState(['name', 'asc']);
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const onHeaderClick = useCallback(
		(id) => {
			const [sortBy, sortDirection] = sort;
			if (sortBy === id) {
				setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
				return;
			}
			setSort([id, 'asc']);
		},
		[sort],
	);

	const getSortedChannels = () => {
		let sortedRooms = rooms;
		if (sort[0] === 'name') {
			sortedRooms = rooms.sort((a, b) => {
				if (a.name < b.name) return -1;
				return a.name > b.name ? 1 : 0;
			});
		} else if (sort[0] === 'usersCount') {
			sortedRooms = rooms.sort((a, b) => a.usersCount - b.usersCount);
		}
		if (sort[1] === 'asc') {
			return sortedRooms.reverse();
		}
		return sortedRooms;
	};

	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs='x24'>
			<GenericTable
				header={
					<>
						<GenericTable.HeaderCell
							key='name'
							sort='name'
							onClick={onHeaderClick}
							direction={sort[1]}
							active={sort[0] === 'name'}
						>
							<CheckBox
								indeterminate={indeterminate}
								checked={checked}
								onChange={onToggleAllRooms}
							/>
							<Box mi='x8'>{t('Channel_name')}</Box>
						</GenericTable.HeaderCell>
						<GenericTable.HeaderCell
							key='usersCount'
							sort='usersCount'
							onClick={onHeaderClick}
							direction={sort[1]}
							active={sort[0] === 'usersCount'}
						>
							<Box width='100%' textAlign='end'>
								{t('Members')}
							</Box>
						</GenericTable.HeaderCell>
					</>
				}
				results={getSortedChannels()}
				params={params}
				setParams={onChangeParams}
				fixed={false}
				pagination={false}
			>
				{({ key, ...room }) => (
					<ChannelRow
						room={room}
						key={key}
						onChange={onChangeRoomSelection}
						selected={!!selectedRooms[room.rid]}
					/>
				)}
			</GenericTable>
		</Box>
	);
};

export default ChannelDeletionTable;
