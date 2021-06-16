import { Box, CheckBox } from '@rocket.chat/fuselage';
import React, { useState, useCallback } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import ChannelRow from './ChannelRow';

const ChannelDesertionTable = ({
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
	const [sort, setSort] = useState(['name', 'asc']);
	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate = eligibleRoomsLength > selectedRoomsLength && selectedRoomsLength > 0;

	const formatDate = useFormatDateAndTime();

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

	const getSortedChannels = useCallback(() => {
		let sortedRooms = rooms;
		if (sort[0] === 'name') {
			sortedRooms = rooms.sort((a, b) => {
				if (a.name < b.name) return -1;
				return a.name > b.name ? 1 : 0;
			});
		} else if (sort[0] === 'joinedAt') {
			sortedRooms = rooms.sort((a, b) => a.ts - b.ts);
		}
		if (sort[1] === 'desc') {
			return sortedRooms.reverse();
		}
		return sortedRooms;
	}, [rooms, sort]);

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
							key='joinedAt'
							sort='joinedAt'
							onClick={onHeaderClick}
							direction={sort[1]}
							active={sort[0] === 'joinedAt'}
						>
							<Box width='100%' textAlign='end'>
								{t('Joined_at')}
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
				{(room, key) => (
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
