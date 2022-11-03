import { Table } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const style = { wordBreak: 'break-word' };

const DescriptionListEntry = ({ children, label, ...props }) => (
	<Table.Row {...props}>
		<Table.Cell is='th' scope='col' align='end' color='hint' backgroundColor='surface' fontScale='p2m' style={style}>
			{label}
		</Table.Cell>
		<Table.Cell align='start' color='default' style={style}>
			{children}
		</Table.Cell>
	</Table.Row>
);

export default memo(DescriptionListEntry);
