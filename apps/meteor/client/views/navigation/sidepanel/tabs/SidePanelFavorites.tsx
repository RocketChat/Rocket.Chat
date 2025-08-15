import { useTranslation } from 'react-i18next';

import { sidePanelFiltersConfig, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelFavorites = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('favorites');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.favorites.title)}
			currentTab='favorites'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelFavorites;
