import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const DNSText: FC<{
	text: string;
}> = ({ text }) => <Box style={{ marginTop: 8, fontWeight: 'bold', fontSize: '95%' }}>{text}</Box>;

export default DNSText;
