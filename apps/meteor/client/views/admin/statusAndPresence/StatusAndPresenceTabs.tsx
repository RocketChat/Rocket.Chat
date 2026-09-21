import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

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
		<Tabs>
			{canViewSettings && (
				<TabsItem selected={currentTab === 'settings'} onClick={() => onChange('settings')}>
					{t('Settings')}
				</TabsItem>
			)}
			{canManageCustomStatus && (
				<TabsItem selected={currentTab === 'custom-status'} onClick={() => onChange('custom-status')}>
					{t('Custom_User_Status')}
				</TabsItem>
			)}
			{canManageUserPresence && (
				<TabsItem selected={currentTab === 'user-presence'} onClick={() => onChange('user-presence')}>
					{t('User_Status')}
				</TabsItem>
			)}
		</Tabs>
	);
};

export default StatusAndPresenceTabs;
