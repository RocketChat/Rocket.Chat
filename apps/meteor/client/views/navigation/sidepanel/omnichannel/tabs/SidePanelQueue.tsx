import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import {
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

	const rooms = useSidePanelRoomsListTab('queue');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();
	const shouldDisplayQueue = hasEEModule && canViewOmnichannelQueue;
	useRedirectToDefaultTab(!shouldDisplayQueue);

	if (!shouldDisplayQueue) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.queue.title)}
			currentTab='queue'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelQueue;
