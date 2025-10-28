import { type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import SidePanelParentRoom from './SidePanelParentRoom';
import SidePanelParentTeam from './SidePanelParentTeam';

const SidePanelParent = ({ room }: { room: SubscriptionWithRoom }) => {
	if (room.prid) {
		return <SidePanelParentRoom prid={room.prid} />;
	}

	return room.teamId && !room.teamMain && <SidePanelParentTeam room={room} />;
};

export default memo(SidePanelParent);
