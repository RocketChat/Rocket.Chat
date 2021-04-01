import React from 'react';
import { Box, CheckBox, Table, Icon, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import GenericTable from '../../../../../components/GenericTable';
import { useRoomIcon } from '../../../../../hooks/useRoomIcon';
import { useTranslation } from '../../../../../contexts/TranslationContext';

const ChannelRow = ({ onChange, selected, room }) => {
	const { name, fname, usersCount } = room;

	const handleChange = useMutableCallback(() => onChange(room));

	return <Table.Row action>
		<Table.Cell maxWidth='x300' withTruncatedText >
			<CheckBox checked={selected} onChange={handleChange}/>
			<Margins inline='x8'>
				<Icon size='x16' {...useRoomIcon(room)} />
				{fname ?? name}
			</Margins>
		</Table.Cell>

		<Table.Cell align='end' withTruncatedText>
			{usersCount}
		</Table.Cell>
	</Table.Row>;
};

const ChannelDeletionTable = ({
	rooms,
	params,
	onChangeParams,
	onChangeRoomSelection,
	selectedRooms,
	onToggleAllRooms,
}) => {
	const t = useTranslation();

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = rooms.length === selectedRoomsLength;
	const indeterminate = rooms.length > selectedRoomsLength && selectedRoomsLength > 0;

	return <Box display='flex' flexDirection='column' height='x200' mbs='x24'>
		<GenericTable
			header={<>
				<GenericTable.HeaderCell key='name' sort='name'>
					<CheckBox indeterminate={indeterminate} checked={checked} onChange={onToggleAllRooms}/>
					<Box mi='x8'>{t('Channel_name')}</Box>
				</GenericTable.HeaderCell>
				<GenericTable.HeaderCell key='usersCount' sort='usersCount'>
					<Box width='100%' textAlign='end'>{t('Members')}</Box>
				</GenericTable.HeaderCell>
			</>}
			results={rooms}
			params={params}
			setParams={onChangeParams}
			fixed={false}
			pagination={false}
		>
			{({ key, ...room }) => <ChannelRow
				room={room}
				key={key}
				onChange={onChangeRoomSelection}
				selected={!!selectedRooms[room.rid]}
			/>}
		</GenericTable>
	</Box>;
};

export default ChannelDeletionTable;
