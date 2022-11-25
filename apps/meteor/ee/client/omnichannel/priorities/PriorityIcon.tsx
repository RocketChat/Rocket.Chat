import { Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

type PriorityIconProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color'> & {
	level: 1 | 2 | 3 | 4 | 5;
};

const PRIORITIES = {
	// TODO: Update colors to fuselage Palette
	1: {
		iconName: 'chevron-double-up',
		color: '#B30A20',
	},
	2: {
		iconName: 'chevron-up',
		color: '#B30A20',
	},
	3: {
		iconName: 'equal',
		color: '#B68D00',
	},
	4: {
		iconName: 'chevron-down',
		color: '#10529E',
	},
	5: {
		iconName: 'chevron-double-down',
		color: '#10529E',
	},
} as const;

export const PriorityIcon = ({ level, size = 20, ...props }: PriorityIconProps): ReactElement | null => {
	const { iconName, color } = PRIORITIES[level] || {};

	if (!iconName) {
		return null;
	}

	return <Icon {...props} name={iconName} color={color} size={size} />;
};
