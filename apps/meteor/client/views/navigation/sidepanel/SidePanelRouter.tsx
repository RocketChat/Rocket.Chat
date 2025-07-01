import SidePanelAll from './tabs/SidePanelAll';
import { ALL_GROUPS, useSidePanelFilter } from '../contexts/RoomsNavigationContext';
import SidePanelChannels from './tabs/SidePanelChannels';
import SidePanelDiscussions from './tabs/SidePanelDiscussions';
import SidePanelFavorites from './tabs/SidePanelFavorites';
import SidePanelMentions from './tabs/SidePanelMentions';
import SidePanelTeams from './tabs/SidePanelTeams';

const SidePanelRouter = () => {
	const [currentTab] = useSidePanelFilter();

	// TODO: figure out if we need this switch
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
			return <SidePanelTeams />;
		case ALL_GROUPS.CHANNELS:
			return <SidePanelChannels />;
		case ALL_GROUPS.DIRECT_MESSAGES:
			return <SidePanelChannels />;
		default:
			return null;
	}
};

export default SidePanelRouter;
