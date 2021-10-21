import { Box, AvatarProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import BaseAvatar from './BaseAvatar';

interface IAppAvatar {
	iconFileContent: string;
	iconFileData: string;
	size: AvatarProps['size'];
}

const AppAvatar: FC<IAppAvatar> = ({ iconFileContent, size, iconFileData, ...props }) => (
	<Box {...props}>
		<BaseAvatar
			size={size}
			objectFit
			url={iconFileContent || `data:image/png;base64,${iconFileData}`}
		/>
	</Box>
);

export default AppAvatar;
