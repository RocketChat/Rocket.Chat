import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import {
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelQueueListTab,
	useUnreadOnlyToggle,
} from '../../../contexts/RoomsNavigationContext';
import SidePanelInquiry from '../../SidePanelInquiry';

const SidePanelQueue = () => {
	const { t } = useTranslation();
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	const rooms = useSidePanelQueueListTab();
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	useRedirectToDefaultTab(!canViewOmnichannelQueue);

	if (!canViewOmnichannelQueue) {
		return null;
	}

	return (
		<SidePanelInquiry
			title={t(sidePanelFiltersConfig.queue.title)}
			currentTab='queue'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelQueue;
