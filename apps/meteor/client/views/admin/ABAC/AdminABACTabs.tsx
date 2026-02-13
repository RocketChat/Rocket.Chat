import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const AdminABACTabs = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const handleTabClick = (tab: string) => {
		router.navigate({
			name: 'admin-ABAC',
			params: { tab },
		});
	};
	return (
		<Tabs>
			<TabsItem selected={tab === 'settings'} onClick={() => handleTabClick('settings')}>
				{t('Settings')}
			</TabsItem>
			<TabsItem selected={tab === 'room-attributes'} onClick={() => handleTabClick('room-attributes')}>
				{t('ABAC_Room_Attributes')}
			</TabsItem>
			<TabsItem selected={tab === 'rooms'} onClick={() => handleTabClick('rooms')}>
				{t('Rooms')}
			</TabsItem>
			<TabsItem selected={tab === 'logs'} onClick={() => handleTabClick('logs')}>
				{t('ABAC_Logs')}
			</TabsItem>
		</Tabs>
	);
};

export default AdminABACTabs;
