import { useSetting, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelDiscussions = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.DISCUSSIONS);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	useRedirectToDefaultTab(!isDiscussionEnabled);

	if (!isDiscussionEnabled) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.DISCUSSIONS].title)}
			currentTab={SIDE_PANEL_GROUPS.DISCUSSIONS}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelDiscussions;
