import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelAll = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.ALL);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.ALL].title)}
			currentTab={SIDE_PANEL_GROUPS.ALL}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelAll;
