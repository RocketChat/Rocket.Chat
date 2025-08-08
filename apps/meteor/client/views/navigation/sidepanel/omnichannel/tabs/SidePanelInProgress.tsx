import { useTranslation } from 'react-i18next';

import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../../contexts/RoomsNavigationContext';
import SidePanel from '../../SidePanel';

const SidePanelInProgress = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.IN_PROGRESS);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.IN_PROGRESS].title)}
			currentTab={SIDE_PANEL_GROUPS.IN_PROGRESS}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelInProgress;
