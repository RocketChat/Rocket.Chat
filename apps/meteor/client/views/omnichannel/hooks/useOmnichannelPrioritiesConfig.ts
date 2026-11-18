import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { Keys } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelPriorities } from './useOmnichannelPriorities';

type PrioritiesConfig = {
	iconName: Keys;
	color?: 'danger' | 'status-font-on-warning' | 'info';
	variant?: 'secondary-danger' | 'secondary-warning' | 'secondary-info';
};

export const PRIORITIES_CONFIG: Record<number, PrioritiesConfig> = {
	[LivechatPriorityWeight.NOT_SPECIFIED]: {
		iconName: 'circle-unfilled',
	},
	[LivechatPriorityWeight.HIGHEST]: {
		iconName: 'chevron-double-up',
		color: 'danger',
		variant: 'secondary-danger',
	},
	[LivechatPriorityWeight.HIGH]: {
		iconName: 'chevron-up',
		color: 'danger',
		variant: 'secondary-danger',
	},
	[LivechatPriorityWeight.MEDIUM]: {
		iconName: 'equal',
		color: 'status-font-on-warning',
		variant: 'secondary-warning',
	},
	[LivechatPriorityWeight.LOW]: {
		iconName: 'chevron-down',
		color: 'info',
		variant: 'secondary-info',
	},
	[LivechatPriorityWeight.LOWEST]: {
		iconName: 'chevron-double-down',
		color: 'info',
		variant: 'secondary-info',
	},
};

export const useOmnichannelPrioritiesConfig = (level: LivechatPriorityWeight, showUnprioritized: boolean) => {
	const { t } = useTranslation();

	const { iconName, color, variant } = PRIORITIES_CONFIG[level];
	const { data: priorities } = useOmnichannelPriorities();

	const name = useMemo(() => {
		const { _id, dirty, name, i18n } = priorities.find((p) => p.sortItem === level) || {};

		if (!_id) {
			return '';
		}

		return dirty ? name : t(i18n!);
	}, [level, priorities, t]);

	if (!showUnprioritized && level === LivechatPriorityWeight.NOT_SPECIFIED) {
		return null;
	}

	return { iconName, name, color, variant };
};
