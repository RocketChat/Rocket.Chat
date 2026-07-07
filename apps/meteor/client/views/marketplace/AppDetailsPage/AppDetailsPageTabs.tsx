import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { ISettings } from '../../../apps/@types/IOrchestrator';

type AppDetailsPageTabsProps = {
	context: string;
	installed: boolean | undefined;
	isSecurityVisible: boolean;
	settings: ISettings | undefined;
	tab: string | undefined;
	hasCluster: boolean;
};

const AppDetailsPageTabs = ({
	context,
	installed = false,
	isSecurityVisible,
	settings,
	tab,
	hasCluster = false,
}: AppDetailsPageTabsProps) => {
	const { t } = useTranslation();
	const isAdminUser = usePermission('manage-apps');

	const router = useRouter();

	const handleTabClick = (tab: 'details' | 'security' | 'releases' | 'settings' | 'logs' | 'requests' | 'instances') => {
		router.navigate(
			{
				name: 'marketplace',
				params: { ...router.getRouteParameters(), tab },
			},
			{ replace: true },
		);
	};

	return (
		<Tabs>
			<TabsItem onClick={() => handleTabClick('details')} selected={!tab || tab === 'details'}>
				{t('Details')}
			</TabsItem>
			{isAdminUser && context !== 'private' && (
				<TabsItem onClick={() => handleTabClick('requests')} selected={tab === 'requests'}>
					{t('Requests')}
				</TabsItem>
			)}
			{isSecurityVisible && (
				<TabsItem onClick={() => handleTabClick('security')} selected={tab === 'security'}>
					{t('Security')}
				</TabsItem>
			)}
			{context !== 'private' && (
				<TabsItem onClick={() => handleTabClick('releases')} selected={tab === 'releases'}>
					{t('Releases')}
				</TabsItem>
			)}
			{installed && Boolean(settings && Object.values(settings).length) && isAdminUser && (
				<TabsItem onClick={() => handleTabClick('settings')} selected={tab === 'settings'}>
					{t('Settings')}
				</TabsItem>
			)}
			{installed && isAdminUser && (
				<TabsItem onClick={() => handleTabClick('logs')} selected={tab === 'logs'}>
					{t('Logs')}
				</TabsItem>
			)}
			{hasCluster && installed && isAdminUser && (
				<TabsItem onClick={() => handleTabClick('instances')} selected={tab === 'instances'}>
					{t('Instances')}
				</TabsItem>
			)}
		</Tabs>
	);
};

export default AppDetailsPageTabs;
