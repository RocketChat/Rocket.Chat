import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { CheckBox, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import { GenericTableRow, GenericTableCell } from '../../../../../../components/GenericTable';
import { RoomIcon } from '../../../../../../components/RoomIcon';

type ChannelDeletionTableRowProps = {
	room: Serialized<IRoom>;
	onChange: (room: Serialized<IRoom>) => void;
	selected: boolean;
};

const ChannelDeletionTableRow = ({ room, onChange, selected }: ChannelDeletionTableRowProps) => {
	const { name, fname, usersCount } = room;
	const handleChange = useEffectEvent(() => onChange(room));

	return (
		<GenericTableRow action>
			<GenericTableCell maxWidth='x300' withTruncatedText>
				<CheckBox checked={selected} onChange={handleChange} />
				<Margins inline='x8'>
					<RoomIcon room={room} />
					{fname ?? name}
				</Margins>
			</GenericTableCell>
			<GenericTableCell align='end' withTruncatedText>
				{usersCount}
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ChannelDeletionTableRow;
