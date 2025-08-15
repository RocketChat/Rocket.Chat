import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelChannels from './SidePanelChannels';
import SidePanelTeams from './SidePanelTeams';
import { withErrorBoundary } from '../../../../components/withErrorBoundary';
import { useSidePanelFilter } from '../../contexts/RoomsNavigationContext';

const SidePanelRooms = ({ parentRid }: { parentRid: string }) => {
	const [currentTab] = useSidePanelFilter();
	const subscription = useUserSubscription(parentRid);

	if (!subscription) {
		return null;
	}

	switch (currentTab) {
		case 'teams':
			return <SidePanelTeams parentRid={parentRid} subscription={subscription} />;
		case 'channels':
		case 'directMessages':
			return <SidePanelChannels parentRid={parentRid} subscription={subscription} />;
		default:
			return null;
	}
};

export default withErrorBoundary(SidePanelRooms);
