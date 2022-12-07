import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { CheckBox, TableRow, TableCell, Icon, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type ChannelDesertionTableRowProps = {
	onChange: (room: Serialized<IRoom> & { isLastOwner?: boolean }) => void;
	selected: boolean;
	room: Serialized<IRoom> & { isLastOwner?: boolean };
	lastOwnerWarning?: string;
};

const ChannelDesertionTableRow = ({ room, onChange, selected, lastOwnerWarning }: ChannelDesertionTableRowProps): ReactElement => {
	const { name, fname, ts, isLastOwner } = room;
	const formatDate = useFormatDateAndTime();
	const handleChange = useMutableCallback(() => onChange(room));

	return (
		<TableRow action>
			<TableCell maxWidth='x300' withTruncatedText>
				<CheckBox checked={selected} onChange={handleChange} disabled={room.isLastOwner} />
				<Margins inline='x8'>
					<Icon name={room.t === 'p' ? 'hashtag-lock' : 'hashtag'} />
					{fname ?? name}
					{isLastOwner && <Icon size='x16' name='info-circled' color='danger' title={lastOwnerWarning} />}
				</Margins>
			</TableCell>
			<TableCell align='end' withTruncatedText>
				{formatDate(ts)}
			</TableCell>
		</TableRow>
	);
};

export default ChannelDesertionTableRow;
