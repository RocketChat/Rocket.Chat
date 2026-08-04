import { useTranslation } from 'react-i18next';

import { sidePanelFiltersConfig, useSidePanelRoomsListTab, useUnreadOnlyToggle } from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelMentions = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('mentions');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.mentions.title)}
			currentTab='mentions'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelMentions;
