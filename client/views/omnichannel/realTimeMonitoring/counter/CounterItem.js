import React from 'react';
import { Box } from '@rocket.chat/fuselage';

const CounterItem = ({ title = '', count = '-', ...props }) => <Box
	display='flex'
	flexDirection='column'
	justifyContent='space-between'
	alignItems='center'
	flexGrow={1}
	{...props}
>
	<Box fontScale='s1' textTransform='uppercase' color='hint' textAlign='center' pi='x8'>
		{title}
	</Box>
	<Box fontScale='h1'>
		{count}
	</Box>
</Box>;

export default CounterItem;
