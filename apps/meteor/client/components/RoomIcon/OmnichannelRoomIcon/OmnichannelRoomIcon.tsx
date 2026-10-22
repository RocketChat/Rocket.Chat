import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { UserStatus, isOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import type { StatusIconProps } from '@rocket.chat/fuselage';

import { OmnichannelAppSourceRoomIcon } from './OmnichannelAppSourceRoomIcon';
import { OmnichannelCoreSourceRoomIcon } from './OmnichannelCoreSourceRoomIcon';

const statuses = {
	busy: 'danger',
	away: 'warning',
	online: 'success',
	offline: 'hint',
	disabled: 'hint',
} as const;

export type OmnichannelRoomIconProps = {
	source: IOmnichannelSource;
	status?: UserStatus;
	size: StatusIconProps['size'];
	placement?: 'sidebar' | 'default';
};

export const OmnichannelRoomIcon = ({ source, status, size = 'x16', placement = 'default' }: OmnichannelRoomIconProps) => {
	const iconStatus = statuses[status || UserStatus.OFFLINE];

	if (isOmnichannelSourceFromApp(source)) {
		return <OmnichannelAppSourceRoomIcon source={source} placement={placement} status={iconStatus} size={size} />;
	}

	return <OmnichannelCoreSourceRoomIcon source={source} status={iconStatus} size={size} />;
};
