import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelChannels from './SidePanelChannels';
import SidePanelTeams from './SidePanelTeams';
import { withErrorBoundary } from '../../../../components/withErrorBoundary';
import { ALL_GROUPS, useSidePanelFilter } from '../../contexts/RoomsNavigationContext';

const SidePanelRooms = ({ parentRid }: { parentRid: string }) => {
	const [currentTab] = useSidePanelFilter();
	const subscription = useUserSubscription(parentRid);

	if (!subscription) {
		return null;
	}

	switch (currentTab) {
		case ALL_GROUPS.TEAMS:
			return <SidePanelTeams parentRid={parentRid} subscription={subscription} />;
		case ALL_GROUPS.CHANNELS:
		case ALL_GROUPS.DIRECT_MESSAGES:
			return <SidePanelChannels parentRid={parentRid} subscription={subscription} />;
		default:
			return null;
	}
};

export default withErrorBoundary(SidePanelRooms);
