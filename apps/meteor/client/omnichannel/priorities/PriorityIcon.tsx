import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { Icon, Palette } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelPriorities } from '../hooks/useOmnichannelPriorities';

type PriorityIconProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color'> & {
	level: LivechatPriorityWeight;
	showUnprioritized?: boolean;
};

export const PRIORITY_ICONS: Record<number, { iconName: Keys; color?: string }> = {
	[LivechatPriorityWeight.NOT_SPECIFIED]: {
		iconName: 'circle-unfilled',
	},
	[LivechatPriorityWeight.HIGHEST]: {
		iconName: 'chevron-double-up',
		color: Palette.badge['badge-background-level-4'].toString(),
	},
	[LivechatPriorityWeight.HIGH]: {
		iconName: 'chevron-up',
		color: Palette.badge['badge-background-level-4'].toString(),
	},
	[LivechatPriorityWeight.MEDIUM]: {
		iconName: 'equal',
		color: Palette.badge['badge-background-level-3'].toString(),
	},
	[LivechatPriorityWeight.LOW]: {
		iconName: 'chevron-down',
		color: Palette.badge['badge-background-level-2'].toString(),
	},
	[LivechatPriorityWeight.LOWEST]: {
		iconName: 'chevron-double-down',
		color: Palette.badge['badge-background-level-2'].toString(),
	},
};

export const PriorityIcon = ({ level, size = 20, showUnprioritized = false, ...props }: PriorityIconProps): ReactElement | null => {
	const { t } = useTranslation();
	const { iconName, color } = PRIORITY_ICONS[level] || {};
	const { data: priorities } = useOmnichannelPriorities();

	const name = useMemo(() => {
		const { _id, dirty, name, i18n } = priorities.find((p) => p.sortItem === level) || {};

		if (!_id) {
			return '';
		}

		return dirty ? name : t(i18n as TranslationKey);
	}, [level, priorities, t]);

	if (!showUnprioritized && level === LivechatPriorityWeight.NOT_SPECIFIED) {
		return null;
	}

	return iconName ? <Icon {...props} name={iconName} color={color} size={size} title={name} /> : null;
};
