import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import BaseAvatar from './BaseAvatar';

export default function AppAvatar({ iconFileContent, iconFileData, ...props }) {
	return (
		<Box {...props}>
			<BaseAvatar objectFit url={iconFileContent || `data:image/png;base64,${ iconFileData }`}/>
		</Box>
	);
}
