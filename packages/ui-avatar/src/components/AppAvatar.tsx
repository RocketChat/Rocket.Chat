import type { ReactElement } from 'react';

import BaseAvatar, { BaseAvatarProps } from './BaseAvatar';

type AppAvatarProps = Pick<BaseAvatarProps, 'size'> & {
	iconFileContent: string;
	iconFileData: string;
};

export default function AppAvatar({ iconFileContent, iconFileData, size }: AppAvatarProps): ReactElement {
	return <BaseAvatar size={size} url={iconFileContent || `data:image/png;base64,${iconFileData}`} />;
}
