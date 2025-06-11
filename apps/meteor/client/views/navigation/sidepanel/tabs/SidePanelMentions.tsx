import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SIDE_PANEL_GROUPS, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelMentions = () => {
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.MENTIONS);
	const [unreadOnly, toggleOnlyUnreads] = useUnreadOnlyToggle();

	return (
		<SidePanel
			currentTab={SIDE_PANEL_GROUPS.MENTIONS}
			onlyUnreads={unreadOnly}
			toggleOnlyUnreads={toggleOnlyUnreads}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelMentions;
