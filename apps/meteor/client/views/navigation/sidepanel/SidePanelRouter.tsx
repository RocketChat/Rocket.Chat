import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import SidePanelAll from './tabs/SidePanelAll';
import { ALL_GROUPS, useRoomsListContext, useSidePanelFilter, useSwitchSidePanelTab } from '../contexts/RoomsNavigationContext';
import SidePanelDiscussions from './tabs/SidePanelDiscussions';
import SidePanelFavorites from './tabs/SidePanelFavorites';
import SidePanelInProgress from './tabs/SidePanelInProgress';
import SidePanelMentions from './tabs/SidePanelMentions';
import SidePanelQueue from './tabs/SidePanelQueue';
import SidePanelRooms from './tabs/SidePanelRooms';
import SidePanelOnHold from './tabs/SidepanelOnHold';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const SidePanelRouter = () => {
	const [currentTab] = useSidePanelFilter();
	const { parentRid } = useRoomsListContext();
	const switchSidePanelTab = useSwitchSidePanelTab();

	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const hasEEModule = useHasLicenseModule('livechat-enterprise');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const isQueueEnabled = useSetting('Livechat_waiting_queue');

	const resetSidePanelTab = () => {
		switchSidePanelTab(ALL_GROUPS.ALL);
		return null;
	};

	switch (currentTab) {
		case ALL_GROUPS.ALL:
			return <SidePanelAll />;
		case ALL_GROUPS.MENTIONS:
			return <SidePanelMentions />;
		case ALL_GROUPS.FAVORITES:
			return <SidePanelFavorites />;
		case ALL_GROUPS.DISCUSSIONS:
			if (isDiscussionEnabled) {
				return <SidePanelDiscussions />;
			}
			return resetSidePanelTab();
		case ALL_GROUPS.TEAMS:
		case ALL_GROUPS.CHANNELS:
		case ALL_GROUPS.DIRECT_MESSAGES:
			return parentRid ? <SidePanelRooms parentRid={parentRid} /> : null;
		case ALL_GROUPS.IN_PROGRESS:
			return <SidePanelInProgress />;
		case ALL_GROUPS.ON_HOLD:
			if (hasEEModule) {
				return <SidePanelOnHold />;
			}
			return resetSidePanelTab();
		case ALL_GROUPS.QUEUE:
			if (hasEEModule && canViewOmnichannelQueue && isQueueEnabled) {
				return <SidePanelQueue />;
			}
			return resetSidePanelTab();
		default:
			return resetSidePanelTab();
	}
};

export default SidePanelRouter;
