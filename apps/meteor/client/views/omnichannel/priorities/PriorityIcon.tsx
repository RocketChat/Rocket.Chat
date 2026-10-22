import type { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { Icon, StatusIcon, type StatusIconProps } from '@rocket.chat/fuselage';

import { useOmnichannelPrioritiesConfig } from '../hooks/useOmnichannelPrioritiesConfig';

export type PriorityIconProps = Omit<StatusIconProps, 'name' | 'status'> & {
	level: LivechatPriorityWeight;
	showUnprioritized?: boolean;
};

export const PriorityIcon = ({ level, size = 20, showUnprioritized = false, ...props }: PriorityIconProps) => {
	const prioritiesConfig = useOmnichannelPrioritiesConfig(level, showUnprioritized);

	if (!prioritiesConfig) {
		return null;
	}

	if (!prioritiesConfig.status) {
		return <Icon {...props} name={prioritiesConfig.iconName} size={size} title={prioritiesConfig.name} />;
	}

	return (
		<StatusIcon {...props} name={prioritiesConfig.iconName} status={prioritiesConfig.status} size={size} title={prioritiesConfig.name} />
	);
};
