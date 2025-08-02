import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import {
	SIDE_PANEL_GROUPS,
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../contexts/RoomsNavigationContext';
import SidePanel from '../SidePanel';

const SidePanelOnHold = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab(SIDE_PANEL_GROUPS.ON_HOLD);
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	const hasEEModule = useHasLicenseModule('livechat-enterprise');
	useRedirectToDefaultTab(!hasEEModule);

	if (!hasEEModule) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig[SIDE_PANEL_GROUPS.ON_HOLD].title)}
			currentTab={SIDE_PANEL_GROUPS.ON_HOLD}
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms as SubscriptionWithRoom[]}
		/>
	);
};

export default SidePanelOnHold;
