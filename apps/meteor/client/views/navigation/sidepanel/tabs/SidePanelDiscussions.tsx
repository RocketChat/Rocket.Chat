import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import {
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelDiscussions = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('discussions');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	useRedirectToDefaultTab(!isDiscussionEnabled);

	if (!isDiscussionEnabled) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.discussions.title)}
			currentTab='discussions'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelDiscussions;
