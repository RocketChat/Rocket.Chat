import type { ReactNode } from 'react';

import { IconButton, type IconButtonProps } from '../../Button';

export type MessageMetricsFollowingProps = {
	name: 'bell' | 'bell-off';
	badge?: ReactNode;
} & Omit<IconButtonProps, 'icon'>;

const MessageMetricsFollowing = ({ name, className, ...props }: MessageMetricsFollowingProps) => (
	<IconButton size='small' {...props} className={['rcx-message-metrics__item__follow', className].filter(Boolean).join(' ')} icon={name} />
);

export default MessageMetricsFollowing;
