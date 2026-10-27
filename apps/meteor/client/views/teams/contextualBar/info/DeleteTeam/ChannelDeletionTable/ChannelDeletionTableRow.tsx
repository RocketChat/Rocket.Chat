import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, CheckBox } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';

import { RoomIcon } from '../../../../../../components/RoomIcon';

export type ChannelDeletionTableRowProps = {
	room: Serialized<IRoom>;
	onChange: (room: Serialized<IRoom>) => void;
	selected: boolean;
};

const ChannelDeletionTableRow = ({ room, onChange, selected }: ChannelDeletionTableRowProps) => {
	const { name, fname, usersCount } = room;
	const handleChange = useStableCallback(() => onChange(room));

	return (
		<GenericTableRow action>
			<GenericTableCell truncate>
				<CheckBox checked={selected} onChange={handleChange} />
				<Box is='span' marginInline='x8'>
					<RoomIcon room={room} />
				</Box>
				{fname ?? name}
			</GenericTableCell>
			<GenericTableCell align='end' truncate>
				{usersCount}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ChannelDeletionTableRow;
