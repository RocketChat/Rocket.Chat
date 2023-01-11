import type { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { Icon, Palette } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

type PriorityIconProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color'> & {
	level: LivechatPriorityWeight;
};

const PRIORITIES: Record<number, { iconName: Keys; color: string }> = {
	1: {
		iconName: 'chevron-double-up',
		color: Palette.badge['badge-background-level-4'].toString(),
	},
	2: {
		iconName: 'chevron-up',
		color: Palette.badge['badge-background-level-4'].toString(),
	},
	3: {
		iconName: 'equal',
		color: Palette.badge['badge-background-level-3'].toString(),
	},
	4: {
		iconName: 'chevron-down',
		color: Palette.badge['badge-background-level-2'].toString(),
	},
	5: {
		iconName: 'chevron-double-down',
		color: Palette.badge['badge-background-level-2'].toString(),
	},
};

export const PriorityIcon = ({ level, size = 20, ...props }: PriorityIconProps): ReactElement | null => {
	const { iconName, color } = PRIORITIES[level] || {};

	if (!iconName) {
		return null;
	}

	return <Icon {...props} name={iconName} color={color} size={size} />;
};
