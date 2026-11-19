import { IconButton, type IconButtonProps } from '../../Button';

export type MessageMetricsFollowingProps = {
	/** `bell` while the user follows the thread, `bell-off` while they don't. */
	name: 'bell' | 'bell-off';
} & Omit<IconButtonProps, 'icon'>;

/**
 * Follows or unfollows the thread, as an icon button in a metrics row.
 */
const MessageMetricsFollowing = ({ name, ...props }: MessageMetricsFollowingProps) => <IconButton size='small' {...props} icon={name} />;

export default MessageMetricsFollowing;
