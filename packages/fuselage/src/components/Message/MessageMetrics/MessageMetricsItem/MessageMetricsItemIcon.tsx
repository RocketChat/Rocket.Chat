import { Icon, type IconProps } from '../../../Icon';

export type MessageMetricsItemIconProps = {
	name: 'thread' | 'user' | 'clock' | 'discussion';
} & Omit<IconProps, 'name'>;

/**
 * The icon of a metrics entry.
 */
const MessageMetricsItemIcon = (props: MessageMetricsItemIconProps) => <Icon size='x20' {...props} />;

export default MessageMetricsItemIcon;
