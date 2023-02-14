import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback } from 'react';

import GenericTable from '../../../../../components/GenericTable';
import ChannelRow from './ChannelRow';

const ChannelDeletionTable = ({ rooms, params, onChangeParams, onChangeRoomSelection, selectedRooms, onToggleAllRooms }) => {
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
		if (rooms) {
			const sortedRooms = [...rooms];
			const [sortBy, sortOrder] = sort;
			if (sortBy === 'name') {
				sortedRooms.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
			}
			if (sortBy === 'usersCount') {
				sortedRooms.sort((a, b) => a.usersCount - b.usersCount);
			}
			if (sortOrder === 'desc') {
				return sortedRooms?.reverse();
			}
			return sortedRooms;
		}
	};

	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs='x24'>
			<GenericTable
				header={
					<>
						<GenericTable.HeaderCell key='name' sort='name' onClick={onHeaderClick} direction={sort[1]} active={sort[0] === 'name'}>
							<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms} />
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
				{({ key, ...room }) => <ChannelRow room={room} key={key} onChange={onChangeRoomSelection} selected={!!selectedRooms[room._id]} />}
			</GenericTable>
		</Box>
	);
};

export default ChannelDeletionTable;
