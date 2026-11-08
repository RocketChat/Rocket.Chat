import { useTranslation } from 'react-i18next';

import { PageTabs } from '../../../components/PageTabs';

export type StatusAndPresenceTab = 'settings' | 'custom-status' | 'user-presence';

export type StatusAndPresenceTabsProps = {
	currentTab: StatusAndPresenceTab;
	onChange: (tab: StatusAndPresenceTab) => void;
	canManageCustomStatus: boolean;
	canManageUserPresence: boolean;
	canViewSettings: boolean;
};

const StatusAndPresenceTabs = ({
	currentTab,
	onChange,
	canManageCustomStatus,
	canManageUserPresence,
	canViewSettings,
}: StatusAndPresenceTabsProps) => {
	const { t } = useTranslation();

	return (
		<PageTabs
			items={[
				{ id: 'settings', label: t('Settings'), hidden: !canViewSettings },
				{ id: 'custom-status', label: t('Custom_User_Status'), hidden: !canManageCustomStatus },
				{ id: 'user-presence', label: t('Managed_users'), hidden: !canManageUserPresence },
			]}
			selected={currentTab}
			onSelect={onChange}
		/>
	);
};

export default StatusAndPresenceTabs;
