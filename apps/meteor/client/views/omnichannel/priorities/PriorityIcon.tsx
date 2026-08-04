import type { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { IconProps } from '@rocket.chat/fuselage';
import { Icon } from '@rocket.chat/fuselage';

import { useOmnichannelPrioritiesConfig } from '../hooks/useOmnichannelPrioritiesConfig';

export type PriorityIconProps = Omit<IconProps, 'name' | 'color'> & {
	level: LivechatPriorityWeight;
	showUnprioritized?: boolean;
};

export const PriorityIcon = ({ level, size = 20, showUnprioritized = false, ...props }: PriorityIconProps) => {
	const prioritiesConfig = useOmnichannelPrioritiesConfig(level, showUnprioritized);

	if (!prioritiesConfig) {
		return null;
	}

	return <Icon {...props} name={prioritiesConfig.iconName} color={prioritiesConfig.color} size={size} title={prioritiesConfig.name} />;
};
