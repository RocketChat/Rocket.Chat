import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

const iconMap = {
	widget: 'livechat',
	email: 'mail',
	sms: 'sms',
	app: 'headset',
	api: 'headset',
	other: 'headset',
} as const;

export const OmnichannelCoreSourceRoomIcon = ({
	room,
	size = 'x16',
}: {
	room: IOmnichannelRoom;
	size: ComponentProps<typeof Icon>['size'];
}): ReactElement => {
	const icon = iconMap[room.source?.type || 'other'] || 'headset';
	return <Icon name={icon} size={size} color={colors[room.v?.status || 'offline']} />;
};
