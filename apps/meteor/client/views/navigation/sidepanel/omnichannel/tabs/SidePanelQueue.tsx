import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../../contexts/RoomsNavigationContext';
import SidePanel from '../../SidePanel';

const SidePanelQueue = () => {
	const { t } = useTranslation();

	const hasEEModule = useHasLicenseModule('livechat-enterprise');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const isQueueEnabled = useSetting('Livechat_waiting_queue');

	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.QUEUE);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const shouldDisplayQueue = hasEEModule && canViewOmnichannelQueue && isQueueEnabled;
	useRedirectToDefaultTab(!shouldDisplayQueue);

	if (!shouldDisplayQueue) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.QUEUE].title)}
			currentTab={SIDE_PANEL_GROUPS.QUEUE}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelQueue;
