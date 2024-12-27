import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const iconMap = {
	widget: 'livechat',
	email: 'mail',
	sms: 'sms',
	app: 'headset',
	api: 'headset',
	other: 'headset',
} as const;

type OmnichannelCoreSourceRoomIconProps = {
	source: IOmnichannelSource;
	color: ComponentProps<typeof Icon>['color'];
	size: ComponentProps<typeof Icon>['size'];
};

export const OmnichannelCoreSourceRoomIcon = ({ source, color, size }: OmnichannelCoreSourceRoomIconProps) => {
	const icon = iconMap[source?.type || 'other'] || 'headset';
	return <Icon name={icon} size={size} color={color} />;
};
