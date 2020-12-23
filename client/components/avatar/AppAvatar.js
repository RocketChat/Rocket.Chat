import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import BaseAvatar from './BaseAvatar';

const AppAvatar = ({ iconFileContent, size, iconFileData, ...props }) => (
	<Box {...props}>
		<BaseAvatar size={size} url={iconFileContent || `data:image/png;base64,${ iconFileData }`}/>
	</Box>
);

export default AppAvatar;
