import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDE_PANEL_GROUPS, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelFavorites = () => {
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.FAVORITES);
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();

	return (
		<SidePanel
			currentTab={SIDE_PANEL_GROUPS.FAVORITES}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelFavorites;
