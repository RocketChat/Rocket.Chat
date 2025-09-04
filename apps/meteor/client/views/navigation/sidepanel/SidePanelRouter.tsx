import SidePanelAll from './tabs/SidePanelAll';
import { useRoomsListContext, useSidePanelFilter } from '../contexts/RoomsNavigationContext';
import SidePanelInProgress from './omnichannel/tabs/SidePanelInProgress';
import SidePanelQueue from './omnichannel/tabs/SidePanelQueue';
import SidePanelOnHold from './omnichannel/tabs/SidepanelOnHold';
import SidePanelDiscussions from './tabs/SidePanelDiscussions';
import SidePanelFavorites from './tabs/SidePanelFavorites';
import SidePanelRooms from './tabs/SidePanelRooms';

const SidePanelRouter = () => {
	const [currentTab] = useSidePanelFilter();
	const { parentRid } = useRoomsListContext();

	switch (currentTab) {
		case 'all':
			return <SidePanelAll />;
		case 'favorites':
			return <SidePanelFavorites />;
		case 'discussions':
			return <SidePanelDiscussions />;
		case 'teams':
		case 'channels':
		case 'directMessages':
			return parentRid ? <SidePanelRooms parentRid={parentRid} /> : <SidePanelAll />;
		case 'inProgress':
			return <SidePanelInProgress />;
		case 'onHold':
			return <SidePanelOnHold />;
		case 'queue':
			return <SidePanelQueue />;
		default:
			return <SidePanelAll />;
	}
};

export default SidePanelRouter;
