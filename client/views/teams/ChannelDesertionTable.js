import { Box, CheckBox, Table, Icon, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericTable from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { useRoomIcon } from '../../hooks/useRoomIcon';

const ChannelRow = ({ onChange, selected, room, lastOwnerWarning = '', formatDate }) => {
	const { name, fname, ts, isLastOwner } = room;

	const handleChange = useMutableCallback(() => onChange(room));

	return (
		<Table.Row action>
			<Table.Cell maxWidth='x300' withTruncatedText>
				<CheckBox checked={selected} onChange={handleChange} disabled={isLastOwner} />
				<Margins inline='x8'>
					<Icon size='x16' {...useRoomIcon(room)} />
					{fname ?? name}
					{isLastOwner && (
						<Icon size='x16' name='info-circled' color='danger' title={lastOwnerWarning} />
					)}
				</Margins>
			</Table.Cell>

			<Table.Cell align='end' withTruncatedText>
				{formatDate(ts)}
			</Table.Cell>
		</Table.Row>
	);
};

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

	const selectedRoomsLength = Object.values(selectedRooms).filter(Boolean).length;

	const checked = eligibleRoomsLength === selectedRoomsLength;
	const indeterminate = eligibleRoomsLength > selectedRoomsLength && selectedRoomsLength > 0;

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
				{({ key, ...room }) => (
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
