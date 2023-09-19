import { Box, Palette } from '@rocket.chat/fuselage';
import React from 'react';

import { useOmnichannelHighlight } from '../../hooks/useOmnichannelHighlight';

export const OmnichannelHighlight = () => {
	const { isHighlit } = useOmnichannelHighlight();

	if (!isHighlit) {
		return null;
	}

	return <Box width={8} height={8} borderRadius='50%' backgroundColor={Palette.badge['badge-background-level-4'].toString()} />;
};
