import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import SidePanelPriorityTag from './SidePanelPriorityTag';
import { RoomActivityIcon } from '../../../../../omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../../../omnichannel/hooks/useOmnichannelPriorities';

const SidePanelOmnichannelBadges = ({ room }: { room: IOmnichannelRoom }) => {
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	return (
		<>
			{isPriorityEnabled ? <SidePanelPriorityTag priorityWeight={room.priorityWeight} /> : null}
			<RoomActivityIcon room={room} />
		</>
	);
};

export default SidePanelOmnichannelBadges;
