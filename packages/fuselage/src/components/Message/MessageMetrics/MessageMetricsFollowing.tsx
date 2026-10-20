import type { ReactNode } from 'react';

import { IconButton, type IconButtonProps } from '../../Button';

export type MessageMetricsFollowingProps = {
	name: 'bell' | 'bell-off';
	badge?: ReactNode;
} & Omit<IconButtonProps, 'icon'>;

const MessageMetricsFollowing = ({ name, badge, ...props }: MessageMetricsFollowingProps) => (
	<IconButton position='relative' overflow='visible' {...props} small icon={name}>
		{badge && <div className='rcx-message-metrics__item__follow-badge'>{badge}</div>}
	</IconButton>
);

export default MessageMetricsFollowing;
