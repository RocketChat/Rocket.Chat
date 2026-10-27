import type { ReactNode } from 'react';

import { IconButton, type IconButtonProps } from '../../Button';

export type MessageMetricsFollowingProps = {
	name: 'bell' | 'bell-off';
	badge?: ReactNode;
} & Omit<IconButtonProps, 'icon'>;

const MessageMetricsFollowing = ({ name, badge, className, ...props }: MessageMetricsFollowingProps) => (
	<IconButton {...props} className={['rcx-message-metrics__item__follow', className].filter(Boolean).join(' ')} size='small' icon={name}>
		{badge && <div className='rcx-message-metrics__item__follow-badge'>{badge}</div>}
	</IconButton>
);

export default MessageMetricsFollowing;
