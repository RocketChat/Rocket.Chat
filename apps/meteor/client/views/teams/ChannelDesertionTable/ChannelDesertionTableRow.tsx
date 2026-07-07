import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox, Icon, Margins } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import { useId } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type ChannelDesertionTableRowProps = {
	onChange: (room: Serialized<IRoom> & { isLastOwner?: boolean }) => void;
	selected: boolean;
	room: Serialized<IRoom> & { isLastOwner?: boolean };
	lastOwnerWarning?: string;
};

const ChannelDesertionTableRow = ({ room, onChange, selected, lastOwnerWarning }: ChannelDesertionTableRowProps) => {
	const { name, fname, ts, isLastOwner } = room;
	const formatDate = useFormatDateAndTime();
	const checkboxId = useId();
	const handleChange = useStableCallback(() => onChange(room));

	return (
		<GenericTableRow action>
			<GenericTableCell maxWidth='x300' withTruncatedText>
				<CheckBox id={checkboxId} checked={selected} onChange={handleChange} disabled={isLastOwner} />
				<Box is='label' htmlFor={checkboxId} style={{ cursor: isLastOwner ? undefined : 'pointer' }}>
					<Margins inline={8}>
						<Icon name={room.t === 'p' ? 'hashtag-lock' : 'hashtag'} />
						{fname ?? name}
						{isLastOwner && <Icon size='x16' name='info-circled' color='status-font-on-danger' title={lastOwnerWarning} />}
					</Margins>
				</Box>
			</GenericTableCell>
			<GenericTableCell align='end' withTruncatedText>
				{formatDate(ts)}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ChannelDesertionTableRow;
