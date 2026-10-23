import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox, Icon } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableRow, GenericTableCell, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useId } from 'react';

export type ChannelDesertionTableRowProps = {
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
			<GenericTableCell maxWidth='x300' truncate>
				<Box display='flex' alignItems='center'>
					<CheckBox id={checkboxId} checked={selected} onChange={handleChange} disabled={isLastOwner} />
					<Box
						is='label'
						htmlFor={checkboxId}
						display='flex'
						alignItems='center'
						gap={8}
						paddingInline={8}
						withTruncatedText
						style={{ cursor: isLastOwner ? undefined : 'pointer' }}
					>
						<Icon name={room.t === 'p' ? 'hashtag-lock' : 'hashtag'} />
						<Box withTruncatedText>{fname ?? name}</Box>
						{isLastOwner && <Icon size='x16' name='info-circled' color='danger' title={lastOwnerWarning} />}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell align='end' truncate>
				{formatDate(ts)}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ChannelDesertionTableRow;
