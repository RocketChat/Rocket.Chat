import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import {
	sidePanelFiltersConfig,
	useRedirectToDefaultTab,
	useSidePanelRoomsListTab,
	useUnreadOnlyToggle,
} from '../../../contexts/RoomsNavigationContext';
import SidePanel from '../../SidePanel';

const SidePanelOnHold = () => {
	const { t } = useTranslation();
	const rooms = useSidePanelRoomsListTab('onHold');
	const [unreadOnly, toggleUnreadOnly] = useUnreadOnlyToggle();

	const { data: hasEEModule = false } = useHasLicenseModule('livechat-enterprise');
	useRedirectToDefaultTab(!hasEEModule);

	if (!hasEEModule) {
		return null;
	}

	return (
		<SidePanel
			title={t(sidePanelFiltersConfig.onHold.title)}
			currentTab='onHold'
			unreadOnly={unreadOnly}
			toggleUnreadOnly={toggleUnreadOnly}
			rooms={rooms}
		/>
	);
};

export default SidePanelOnHold;
