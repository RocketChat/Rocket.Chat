import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { UserStatus, isOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { OmnichannelAppSourceRoomIcon } from './OmnichannelAppSourceRoomIcon';
import { OmnichannelCoreSourceRoomIcon } from './OmnichannelCoreSourceRoomIcon';

const colors = {
	busy: 'status-font-on-danger',
	away: 'status-font-on-warning',
	online: 'status-font-on-success',
	offline: 'annotation',
	disabled: 'annotation',
} as const;

type OmnichannelRoomIconProps = {
	source: IOmnichannelSource;
	color?: ComponentProps<typeof Icon>['color'];
	status?: UserStatus;
	size: ComponentProps<typeof Icon>['size'];
	placement?: 'sidebar' | 'default';
};

export const OmnichannelRoomIcon = ({ source, color, status, size = 'x16', placement = 'default' }: OmnichannelRoomIconProps) => {
	const iconColor = color ?? colors[status || UserStatus.OFFLINE];

	if (isOmnichannelSourceFromApp(source)) {
		return <OmnichannelAppSourceRoomIcon source={source} placement={placement} color={iconColor} size={size} />;
	}

	return <OmnichannelCoreSourceRoomIcon source={source} color={iconColor} size={size} />;
};
