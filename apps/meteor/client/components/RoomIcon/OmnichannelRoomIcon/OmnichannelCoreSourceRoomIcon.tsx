import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { StatusIcon, type StatusIconProps } from '@rocket.chat/fuselage';

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
	status: StatusIconProps['status'];
	size: StatusIconProps['size'];
};

export const OmnichannelCoreSourceRoomIcon = ({ source, status, size }: OmnichannelCoreSourceRoomIconProps) => {
	const icon = iconMap[source?.type || 'other'] || 'headset';
	return <StatusIcon name={icon} size={size} status={status} />;
};
