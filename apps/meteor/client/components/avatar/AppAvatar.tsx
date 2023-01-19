import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import BaseAvatar from './BaseAvatar';

type AppAvatarProps = {
	iconFileContent: string;
	iconFileData: string;
	size: ComponentProps<typeof BaseAvatar>['size'];
} & ComponentProps<typeof Box>;

export default function AppAvatar({ iconFileContent, size, iconFileData, ...props }: AppAvatarProps): ReactElement {
	return (
		<Box {...props}>
			<BaseAvatar size={size} objectFit url={iconFileContent || `data:image/png;base64,${iconFileData}`} />
		</Box>
	);
}
