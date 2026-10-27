import type { IOmnichannelSourceFromApp } from '@rocket.chat/core-typings';
import { Box, Icon, type IconColor, type IconProps } from '@rocket.chat/fuselage';

import { useOmnichannelRoomIcon } from './context/OmnichannelRoomIconContext';

export type OmnichannelAppSourceRoomIconProps = {
	source: IOmnichannelSourceFromApp;
	color: IconColor;
	size: IconProps['size'];
	placement: 'sidebar' | 'default';
};

export const OmnichannelAppSourceRoomIcon = ({ source, color, size, placement }: OmnichannelAppSourceRoomIconProps) => {
	const icon = (placement === 'sidebar' && source.sidebarIcon) || source.defaultIcon;
	const value = useOmnichannelRoomIcon(source.id, icon || '');

	if (!value) {
		return <Icon name='headset' size={size} color={color} />;
	}

	return (
		<Box size={size} color={color}>
			<Box is='svg' size={size} aria-hidden='true'>
				<Box is='use' href={`#${value}`} />
			</Box>
		</Box>
	);
};
