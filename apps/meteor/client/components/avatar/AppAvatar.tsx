import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import BaseAvatar from './BaseAvatar';

// TODO: frontend chapter day - Remove inline Styling

type AppAvatarProps = {
	/* @deprecated */
	size: 'x36' | 'x28' | 'x16' | 'x40' | 'x124';
	/* @deprecated */
	mie?: 'x80' | 'x20' | 'x8';
	/* @deprecated */
	alignSelf?: 'center';

	iconFileContent: string;
	iconFileData: string;
};

export default function AppAvatar({ iconFileContent, size, iconFileData, ...props }: AppAvatarProps): ReactElement {
	return (
		<Box {...props}>
			<BaseAvatar size={size} objectFit url={iconFileContent || `data:image/png;base64,${iconFileData}`} />
		</Box>
	);
}
