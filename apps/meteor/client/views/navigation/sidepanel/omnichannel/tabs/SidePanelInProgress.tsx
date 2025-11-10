import { useTranslation } from 'react-i18next';

import { sidePanelFiltersConfig, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../../contexts/RoomsNavigationContext';
import SidePanel from '../../SidePanel';

const SidePanelInProgress = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('inProgress');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.inProgress.title)}
			currentTab='inProgress'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelInProgress;
