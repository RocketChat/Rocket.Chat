import { type IOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import { Icon, Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useOmnichannelRoomIcon } from './context/OmnichannelRoomIconContext';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';

type OmnichannelAppSourceRoomIconProps = {
	source: IOmnichannelSourceFromApp;
	color: ComponentProps<typeof Box>['color'];
	size: ComponentProps<typeof Icon>['size'];
	placement: 'sidebar' | 'default';
};

export const OmnichannelAppSourceRoomIcon = ({ source, color, size, placement }: OmnichannelAppSourceRoomIconProps) => {
	const icon = (placement === 'sidebar' && source.sidebarIcon) || source.defaultIcon;
	const { phase, value } = useOmnichannelRoomIcon(source.id, icon || '');

	if ([AsyncStatePhase.REJECTED, AsyncStatePhase.LOADING].includes(phase)) {
		return <Icon name='headset' size={size} color={color} />;
	}

	return (
		<Box size={size} color={color}>
			<Box is='svg' size={size} aria-hidden='true'>
				<Box is='use' href={`#${value}`} />
			</Box>
		</Box>
	);
};
