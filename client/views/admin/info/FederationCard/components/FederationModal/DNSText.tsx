import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

export const DNSText: FC<{
	text: string;
}> = ({ text }) => <Box style={{ marginTop: 8, fontWeight: 'bold', fontSize: '95%' }}>{text}</Box>;
