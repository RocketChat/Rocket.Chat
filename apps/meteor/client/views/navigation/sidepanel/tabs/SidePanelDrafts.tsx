import { useTranslation } from 'react-i18next';

import { sidePanelFiltersConfig, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelDrafts = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('drafts');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.drafts.title)}
			currentTab='drafts'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelDrafts;
