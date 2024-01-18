import type { ReactElement } from 'react';

import { Avatar } from '..';
import { UiAvatarProps } from './Avatar';

type AppAvatarProps = Pick<UiAvatarProps, 'size'> & {
	iconFileContent: string;
	iconFileData: string;
};

export default function AppAvatar({ iconFileContent, iconFileData, size }: AppAvatarProps): ReactElement {
	return <Avatar size={size} objectFit url={iconFileContent || `data:image/png;base64,${iconFileData}`} />;
}
