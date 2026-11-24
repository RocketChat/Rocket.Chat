import type { BaseAvatarProps } from './BaseAvatar.js';
import BaseAvatar from './BaseAvatar.js';

export type AppAvatarProps = Pick<BaseAvatarProps, 'size'> & {
	iconFileContent: string;
	iconFileData: string;
};

export default function AppAvatar({ iconFileContent, iconFileData, size }: AppAvatarProps) {
	return <BaseAvatar size={size} url={iconFileContent || `data:image/png;base64,${iconFileData}`} />;
}
