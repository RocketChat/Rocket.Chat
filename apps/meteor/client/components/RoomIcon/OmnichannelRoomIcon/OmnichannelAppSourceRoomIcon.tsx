import type { IOmnichannelRoomFromAppSource } from '@rocket.chat/core-typings';
import { Icon, Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
import { useOmnichannelRoomIcon } from './context/OmnichannelRoomIconContext';

export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

const convertBoxSizeToNumber = (boxSize: ComponentProps<typeof Icon>['size']): number => {
	switch (boxSize) {
		case 'x20': {
			return 20;
		}
		case 'x24': {
			return 24;
		}
		case 'x16':
		default: {
			return 16;
		}
	}
};

export const OmnichannelAppSourceRoomIcon = ({
	room,
	size = 16,
	placement = 'default',
}: {
	room: IOmnichannelRoomFromAppSource;
	size: ComponentProps<typeof Icon>['size'];
	placement: 'sidebar' | 'default';
}): ReactElement => {
	const color = colors[room.v.status || 'offline'];
	const icon = (placement === 'sidebar' && room.source.sidebarIcon) || room.source.defaultIcon;
	const { phase, value } = useOmnichannelRoomIcon(room.source.id, icon || '');
	const fontSize = convertBoxSizeToNumber(size);
	if ([AsyncStatePhase.REJECTED, AsyncStatePhase.LOADING].includes(phase)) {
		return <Icon name='headset' size={size} color={color} />;
	}
	return (
		<Box size={fontSize} color={color}>
			<Box is='svg' size={fontSize} aria-hidden='true'>
				<Box is='use' href={`#${value}`} />
			</Box>
		</Box>
	);
};
