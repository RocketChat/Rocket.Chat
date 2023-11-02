import { Box, Icon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { FC } from 'react';

type Variant = 'danger' | 'info' | 'success' | 'warning' | 'neutral';

type ColorMapType = {
	[key in Variant]: {
		color: string;
		bg: string;
	};
};

const colorMap: ColorMapType = {
	danger: { color: 'status-font-on-danger', bg: 'status-background-danger' },
	info: { color: 'status-font-on-info', bg: 'status-background-info' },
	success: { color: 'status-font-on-success', bg: 'status-background-success' },
	warning: { color: 'status-font-on-warning', bg: 'status-background-warning' },
	neutral: { color: 'font-secondary-info', bg: 'surface-tint' },
};

const getColors = (type: Variant) => colorMap[type] || colorMap.neutral;

type FramedIconProps = {
	type: Variant;
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
