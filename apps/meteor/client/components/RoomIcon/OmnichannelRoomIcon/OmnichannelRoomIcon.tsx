import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { UserStatus, isOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import type { IconProps } from '@rocket.chat/fuselage';

import { OmnichannelAppSourceRoomIcon } from './OmnichannelAppSourceRoomIcon';
import { OmnichannelCoreSourceRoomIcon } from './OmnichannelCoreSourceRoomIcon';

const colors = {
	busy: 'status-font-on-danger',
	away: 'status-font-on-warning',
	online: 'status-font-on-success',
	offline: 'annotation',
	disabled: 'annotation',
} as const;

export type OmnichannelRoomIconProps = {
	source: IOmnichannelSource;
	color?: IconProps['color'];
	status?: UserStatus;
	size: IconProps['size'];
	placement?: 'sidebar' | 'default';
};

export const OmnichannelRoomIcon = ({ source, color, status, size = 'x16', placement = 'default' }: OmnichannelRoomIconProps) => {
	const iconColor = color ?? colors[status || UserStatus.OFFLINE];

	if (isOmnichannelSourceFromApp(source)) {
		return <OmnichannelAppSourceRoomIcon source={source} placement={placement} color={iconColor} size={size} />;
	}

	return <OmnichannelCoreSourceRoomIcon source={source} color={iconColor} size={size} />;
};
