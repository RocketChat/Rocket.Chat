import { CheckBox, Table, Icon, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useRoomIcon } from '../../../hooks/useRoomIcon';

const ChannelRow = ({ onChange, selected, room, lastOwnerWarning, formatDate }) => {
	const { name, fname, ts, isLastOwner } = room;

	const handleChange = useMutableCallback(() => onChange(room));

	return (
		<Table.Row action>
			<Table.Cell maxWidth='x300' withTruncatedText>
				<CheckBox
					checked={selected}
					onChange={handleChange}
					disabled={lastOwnerWarning && isLastOwner}
				/>
				<Margins inline='x8'>
					<Icon size='x16' {...useRoomIcon(room)} />
					{fname ?? name}
					{lastOwnerWarning && isLastOwner && (
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

export default ChannelRow;
