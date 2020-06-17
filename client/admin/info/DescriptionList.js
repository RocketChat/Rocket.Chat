import { Box, Table } from '@rocket.chat/fuselage';
import React from 'react';

const style = { wordBreak: 'break-word' };

export const DescriptionList = React.memo(({ children, title, ...props }) => <>
	{title && <Box display='flex' justifyContent='flex-end' width='30%' paddingInline='x8'>
		{title}
	</Box>}
	<Table striped marginBlockEnd='x32' width='full' {...props}>
		<Table.Body>
			{children}
		</Table.Body>
	</Table>
</>);

const Entry = ({ children, label, ...props }) =>
	<Table.Row {...props}>
		<Table.Cell is='th' scope='col' width='30%' align='end' color='hint' backgroundColor='surface' fontScale='p2' style={style}>{label}</Table.Cell>
		<Table.Cell width='70%' align='start' color='default' style={style}>{children}</Table.Cell>
	</Table.Row>;

DescriptionList.Entry = React.memo(Entry);
