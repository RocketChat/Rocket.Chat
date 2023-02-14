import { Table } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function IntegrationRow({ name, _id, type, username, _createdAt, _createdBy: { username: createdBy }, channel = [], onClick, isBig }) {
	const formatDateAndTime = useFormatDateAndTime();

	const handler = useMemo(() => onClick(_id, type), [onClick, _id, type]);
	return (
		<Table.Row key={_id} onKeyDown={handler} onClick={handler} tabIndex={0} role='link' action>
			<Table.Cell style={style} color='default' fontScale='p2m'>
				{name}
			</Table.Cell>
			<Table.Cell style={style}>{channel.join(', ')}</Table.Cell>
			<Table.Cell style={style}>{createdBy}</Table.Cell>
			{isBig && <Table.Cell style={style}>{formatDateAndTime(_createdAt)}</Table.Cell>}
			<Table.Cell style={style}>{username}</Table.Cell>
		</Table.Row>
	);
}

export default IntegrationRow;
