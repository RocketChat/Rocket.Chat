import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon, Tag } from '@rocket.chat/fuselage';

import { useOmnichannelPriorities } from '../../../omnichannel/hooks/useOmnichannelPriorities';
import { useOmnichannelPrioritiesConfig } from '../../../omnichannel/hooks/useOmnichannelPrioritiesConfig';

const SidePanelPriorityTag = ({ room }: { room: IOmnichannelRoom }) => {
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const prioritiesConfig = useOmnichannelPrioritiesConfig(room.priorityWeight, false);

	if (!isOmnichannelRoom(room) || !isPriorityEnabled) {
		return null;
	}

	if (!prioritiesConfig?.iconName) {
		return null;
	}

	return (
		<Tag icon={<Icon mie={4} size='x12' name={prioritiesConfig?.iconName} />} variant={prioritiesConfig?.variant}>
			{prioritiesConfig?.name}
		</Tag>
	);
};

export default SidePanelPriorityTag;
