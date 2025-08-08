import { useTranslation } from 'react-i18next';

import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelFavorites = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.FAVORITES);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.FAVORITES].title)}
			currentTab={SIDE_PANEL_GROUPS.FAVORITES}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelFavorites;
