import { Table } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

const style = { wordBreak: 'break-word' };

const DescriptionListEntry = ({ children, label, ...props }) => (
	<Table.Row {...props}>
		<Table.Cell
			is='th'
			scope='col'
			width='30%'
			align='end'
			color='hint'
			backgroundColor='surface'
			fontScale='p2'
			style={style}
		>
			{label}
		</Table.Cell>
		<Table.Cell width='70%' align='start' color='default' style={style}>
			{children}
		</Table.Cell>
	</Table.Row>
);

export default memo(DescriptionListEntry);
