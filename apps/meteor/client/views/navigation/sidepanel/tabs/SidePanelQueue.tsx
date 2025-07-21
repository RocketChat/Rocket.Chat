import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelQueue = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.QUEUE);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.QUEUE].title)}
			currentTab={SIDE_PANEL_GROUPS.QUEUE}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelQueue;
