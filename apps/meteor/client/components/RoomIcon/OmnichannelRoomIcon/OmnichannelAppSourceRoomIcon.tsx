import type { IOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import { Box, StatusIcon, type StatusIconProps } from '@rocket.chat/fuselage';

import { useOmnichannelRoomIcon } from './context/OmnichannelRoomIconContext';

// The colours StatusIcon gives each status, for the app's own SVG icon.
const svgColors = {
	hint: 'hint',
	info: 'info',
	danger: 'danger',
	warning: 'status-font-on-warning',
	success: 'status-font-on-success',
} as const;

export type OmnichannelAppSourceRoomIconProps = {
	source: IOmnichannelSourceFromApp;
	status: StatusIconProps['status'];
	size: StatusIconProps['size'];
	placement: 'sidebar' | 'default';
};

export const OmnichannelAppSourceRoomIcon = ({ source, status, size, placement }: OmnichannelAppSourceRoomIconProps) => {
	const icon = (placement === 'sidebar' && source.sidebarIcon) || source.defaultIcon;
	const value = useOmnichannelRoomIcon(source.id, icon || '');

	if (!value) {
		return <StatusIcon name='headset' size={size} status={status} />;
	}

	return (
		<Box size={size} color={svgColors[status]}>
			<Box is='svg' size={size} aria-hidden='true'>
				<Box is='use' href={`#${value}`} />
			</Box>
		</Box>
	);
};
