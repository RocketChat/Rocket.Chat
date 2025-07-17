import SidePanelAll from './tabs/SidePanelAll';
import { ALL_GROUPS, useRoomsListContext, useSidePanelFilter } from '../contexts/RoomsNavigationContext';
import SidePanelDiscussions from './tabs/SidePanelDiscussions';
import SidePanelFavorites from './tabs/SidePanelFavorites';
import SidepanelInProgress from './tabs/SidePanelInProgress';
import SidePanelMentions from './tabs/SidePanelMentions';
import SidePanelQueue from './tabs/SidePanelQueue';
import SidePanelRooms from './tabs/SidePanelRooms';
import SidePanelOnHold from './tabs/SidepanelOnHold';

const SidePanelRouter = () => {
	const [currentTab] = useSidePanelFilter();
	const { parentRid } = useRoomsListContext();

	switch (currentTab) {
		case ALL_GROUPS.ALL:
			return <SidePanelAll />;
		case ALL_GROUPS.MENTIONS:
			return <SidePanelMentions />;
		case ALL_GROUPS.FAVORITES:
			return <SidePanelFavorites />;
		case ALL_GROUPS.DISCUSSIONS:
			return <SidePanelDiscussions />;
		case ALL_GROUPS.TEAMS:
		case ALL_GROUPS.CHANNELS:
		case ALL_GROUPS.DIRECT_MESSAGES:
			return parentRid ? <SidePanelRooms parentRid={parentRid} /> : null;
		case ALL_GROUPS.IN_PROGRESS:
			return <SidepanelInProgress />;
		case ALL_GROUPS.ON_HOLD:
			return <SidePanelOnHold />;
		case ALL_GROUPS.QUEUE:
			return <SidePanelQueue />;
		default:
			return null;
	}
};

export default SidePanelRouter;
