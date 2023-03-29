import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export const DNSText: FC<{
	text: string;
}> = ({ text }) => (
	<Box mbs='x8' fontWeight='c2' fontSize='p2'>
		{text}
	</Box>
);
