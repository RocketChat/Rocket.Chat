import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelAll from './SidePanelAll';
import SidePanelChannels from './SidePanelChannels';
import SidePanelTeams from './SidePanelTeams';
import { withErrorBoundary } from '../../../../components/withErrorBoundary';
import { useSidePanelFilter } from '../../contexts/RoomsNavigationContext';

const SidePanelRooms = ({ parentRid }: { parentRid: string }) => {
	const [currentTab] = useSidePanelFilter();
	const subscription = useUserSubscription(parentRid);

	if (!subscription) {
		return <SidePanelAll />;
	}

	switch (currentTab) {
		case 'teams':
			return <SidePanelTeams parentRid={parentRid} subscription={subscription} />;
		case 'channels':
		case 'directMessages':
			return <SidePanelChannels parentRid={parentRid} subscription={subscription} />;
	}
};

export default withErrorBoundary(SidePanelRooms);
