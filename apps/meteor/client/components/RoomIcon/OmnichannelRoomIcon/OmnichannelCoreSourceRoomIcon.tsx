import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import type { IconProps } from '@rocket.chat/fuselage';
import { Icon } from '@rocket.chat/fuselage';

const iconMap = {
	widget: 'livechat',
	email: 'mail',
	sms: 'sms',
	app: 'headset',
	api: 'headset',
	other: 'headset',
} as const;

export type OmnichannelCoreSourceRoomIconProps = {
	source: IOmnichannelSource;
	color: IconProps['color'];
	size: IconProps['size'];
};

export const OmnichannelCoreSourceRoomIcon = ({ source, color, size }: OmnichannelCoreSourceRoomIconProps) => {
	const icon = iconMap[source?.type || 'other'] || 'headset';
	return <Icon name={icon} size={size} color={color} />;
};
