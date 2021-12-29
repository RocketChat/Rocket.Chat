import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

export const DNSText: FC<{
	text: string;
}> = ({ text }) => (
	<Box mbs='x8' fontWeight='c2' fontSize='p2'>
		{text}
	</Box>
);
