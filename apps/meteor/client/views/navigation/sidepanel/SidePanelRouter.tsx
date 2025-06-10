import SidePanelAll from './tabs/SidePanelAll';
import { SIDE_PANEL_GROUPS, useSidePanelFilter } from '../contexts/RoomsNavigationContext';

const SidePanelRouter = () => {
	const [currentTab] = useSidePanelFilter();

	// TODO: figure out if we need this switch
	switch (currentTab) {
		case SIDE_PANEL_GROUPS.ALL:
			return <SidePanelAll currentTab={currentTab} />;
		// case SIDE_PANEL_GROUPS.FAVORITES:
		// 	return <SidePanelFavorites currentTab={currentTab} />;
		// case SIDE_PANEL_GROUPS.MENTIONS:
		// 	return null; // TODO implement tab
		// case SIDE_PANEL_GROUPS.DISCUSSIONS:
		// 	return null; // TODO implement tab
		// case SIDE_PANEL_GROUPS.IN_PROGRESS:
		// 	return null; // TODO implement tab
		// case SIDE_PANEL_GROUPS.QUEUE:
		// 	return null; // TODO implement tab
		// case SIDE_PANEL_GROUPS.ON_HOLD:
		// 	return null; // TODO implement tab
		// default:
		// 	return null;
	}
};

export default SidePanelRouter;
