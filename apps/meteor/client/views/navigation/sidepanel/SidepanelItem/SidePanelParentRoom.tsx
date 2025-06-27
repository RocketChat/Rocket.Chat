import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelParentDiscussion from './SidePanelParentDiscussion';
import SidePanelParentTeam from './SidePanelParentTeam';

const SidePanelParentRoom = ({ room }: { room: SubscriptionWithRoom }) => {
	if (room.prid) {
		return <SidePanelParentDiscussion prid={room.prid} />;
	}

	return room.teamId && !room.teamMain && <SidePanelParentTeam room={room} />;
};

export default SidePanelParentRoom;
