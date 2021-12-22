import { Icon, Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import { IOmnichannelRoomFromAppSource } from '../../../../definition/IRoom';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
import { useOmnichannelRoomIcon } from './context/OmnichannelRoomIconContext';

export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

export const OmnichannelAppSourceRoomIcon = ({
	room,
	size = 'x16',
	placement = 'default',
}: {
	room: IOmnichannelRoomFromAppSource;
	size: ComponentProps<typeof Icon>['size'];
	placement: 'sidebar' | 'default';
}): ReactElement => {
	const color = colors[room.v.status || 'offline'];
	const icon = (placement === 'sidebar' && room.source.sidebarIcon) || room.source.defaultIcon;
	const { phase, value } = useOmnichannelRoomIcon(room.source.id, icon || '');
	if ([AsyncStatePhase.REJECTED, AsyncStatePhase.LOADING].includes(phase)) {
		return <Icon name='headset' size={size} color={color} />;
	}
	return (
		<Box color={color}>
			<svg className='rc-icon rc-input__icon-svg rc-input__icon-svg--plus' aria-hidden='true'>
				<use href={`#${value}`} />
			</svg>
		</Box>
	);
};
