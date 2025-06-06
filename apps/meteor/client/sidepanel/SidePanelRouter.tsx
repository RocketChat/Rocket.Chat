import SidePanel from './SidePanel';
// import SidePanelAll from './tabs/SidePanelAll';
// import SidePanelStarred from './tabs/SidePanelStarred';
// import { useSidePanelFilter } from '../views/navigation/contexts/RoomsNavigationContext';

const SidePanelRouter = () => {
	// const [currentTab] = useSidePanelFilter();

	return <SidePanel headerTitle='All' onlyUnreads={false} rooms={[]} toggleOnlyUnreads={() => undefined} />;
	// return <SidePanelAll currentTab='All' />;

	// TODO: figure out if we need this switch
	// switch (currentTab) {
	// 	case SIDE_PANEL_GROUPS.ALL:
	// 		return <SidePanelAll />;
	// 	case SIDE_PANEL_GROUPS.STARRED:
	// 		return <SidePanelStarred />;
	// 	case SIDE_PANEL_GROUPS.MENTIONS:
	// 		return null; // TODO implement tab
	// 	case SIDE_PANEL_GROUPS.DISCUSSIONS:
	// 		return null; // TODO implement tab
	// 	case SIDE_PANEL_GROUPS.IN_PROGRESS:
	// 		return null; // TODO implement tab
	// 	case SIDE_PANEL_GROUPS.QUEUE:
	// 		return null; // TODO implement tab
	// 	case SIDE_PANEL_GROUPS.ON_HOLD:
	// 		return null; // TODO implement tab
	// 	default:
	// 		return null;
	// }
};

export default SidePanelRouter;
