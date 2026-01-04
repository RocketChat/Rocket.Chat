import { useTranslation } from 'react-i18next';

import { sidePanelFiltersConfig, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelAll = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('all');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.all.title)}
			currentTab='all'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelAll;
