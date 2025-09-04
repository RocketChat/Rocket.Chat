import type { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

import { useOmnichannelPrioritiesConfig } from '../hooks/useOmnichannelPrioritiesConfig';

type PriorityIconProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color'> & {
	level: LivechatPriorityWeight;
	showUnprioritized?: boolean;
};

export const PriorityIcon = ({ level, size = 20, showUnprioritized = false, ...props }: PriorityIconProps): ReactElement | null => {
	const prioritiesConfig = useOmnichannelPrioritiesConfig(level, showUnprioritized);

	if (!prioritiesConfig) {
		return null;
	}

	return <Icon {...props} name={prioritiesConfig.iconName} color={prioritiesConfig.color} size={size} title={prioritiesConfig.name} />;
};
