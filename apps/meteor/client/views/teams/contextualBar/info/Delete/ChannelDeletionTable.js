import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericTable from '../../../../../components/GenericTable';
import ChannelRow from './ChannelRow';

const ChannelDeletionTable = ({ rooms, params, onChangeParams, onChangeRoomSelection, selectedRooms, onToggleAllRooms }) => {
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;

	return (
		<Box display='flex' flexDirection='column' height='x200' mbs='x24'>
			<GenericTable
				header={
					<>
						<GenericTable.HeaderCell key='name' sort='name'>
							<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms} />
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
				{({ key, ...room }) => <ChannelRow room={room} key={key} onChange={onChangeRoomSelection} selected={!!selectedRooms[room._id]} />}
			</GenericTable>
		</Box>
	);
};

export default ChannelDeletionTable;
