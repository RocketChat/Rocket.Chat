import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { IconButton, type IconButtonProps } from '../../Button';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainDiv } from '../messageStyles';

const FollowBadge = styled(Text, {
	...plainDiv,
	position: 'absolute',
	top: 0,
	right: 0,
	transform: 'translate(40%, -40%)',
});

export type MessageMetricsFollowingProps = {
	name: 'bell' | 'bell-off';
	badge?: ReactNode;
} & Omit<IconButtonProps, 'icon'>;

const MessageMetricsFollowing = ({ name, badge, ...props }: MessageMetricsFollowingProps) => (
	<IconButton position='relative' overflow='visible' {...props} small icon={name}>
		{badge && <FollowBadge className='rcx-message-metrics__item__follow-badge'>{badge}</FollowBadge>}
	</IconButton>
);

export default withFuselageProvider(MessageMetricsFollowing);
