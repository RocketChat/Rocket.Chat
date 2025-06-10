import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import type { SidePanelFiltersKeys } from '../../contexts/RoomsNavigationContext';
import { useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelMentions = ({ currentTab }: { currentTab: SidePanelFiltersKeys }) => {
	const rooms = useSidePanelRoomsListTab(currentTab);
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();

	return (
		<SidePanel
			currentTab={currentTab}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelMentions;
