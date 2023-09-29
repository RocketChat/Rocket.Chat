import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { FC } from 'react';

const getColors = (type: string) => {
	switch (type) {
		case 'danger':
			return { color: 'status-font-on-danger', bg: 'status-background-danger' };
		case 'info':
			return { color: 'status-font-on-info', bg: 'status-background-info' };
		case 'success':
			return { color: 'status-font-on-success', bg: 'status-background-success' };
		case 'warning':
			return { color: 'status-font-on-warning', bg: 'status-background-warning' };
		default:
			return { color: 'font-secondary-info', bg: 'surface-tint' };
	}
};

type FramedIconProps = {
	type: 'danger' | 'info' | 'success' | 'warning' | 'neutral';
	icon: Keys;
};

export const FramedIcon: FC<FramedIconProps> = ({ type, icon }) => {
	const { color, bg } = getColors(type);

	return (
		<Box is='span' color={color} fontScale='p2m'>
			<Icon name={icon} size={20} bg={bg} p={4} borderRadius={4} />
		</Box>
	);
};
