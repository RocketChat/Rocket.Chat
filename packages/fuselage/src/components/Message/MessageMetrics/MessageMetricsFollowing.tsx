import { IconButton, type IconButtonProps } from '../../Button/index.js';

export type MessageMetricsFollowingProps = {
	name: 'bell' | 'bell-off';
} & Omit<IconButtonProps, 'icon'>;

const MessageMetricsFollowing = ({ name, ...props }: MessageMetricsFollowingProps) => <IconButton size='small' {...props} icon={name} />;

export default MessageMetricsFollowing;
