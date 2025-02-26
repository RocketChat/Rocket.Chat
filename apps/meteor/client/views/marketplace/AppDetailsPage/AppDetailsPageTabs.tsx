import { Tabs } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { ISettings } from '../../../apps/@types/IOrchestrator';

type AppDetailsPageTabsProps = {
	context: string;
	installed: boolean | undefined;
	isSecurityVisible: boolean;
	settings: ISettings | undefined;
	tab: string | undefined;
};

const AppDetailsPageTabs = ({ context, installed, isSecurityVisible, settings, tab }: AppDetailsPageTabsProps): ReactElement => {
	const { t } = useTranslation();
	const isAdminUser = usePermission('manage-apps');

	const router = useRouter();

	const handleTabClick = (tab: 'details' | 'security' | 'releases' | 'settings' | 'logs' | 'requests') => {
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
			<Tabs.Item onClick={() => handleTabClick('details')} selected={!tab || tab === 'details'}>
				{t('Details')}
			</Tabs.Item>
			{isAdminUser && context !== 'private' && (
				<Tabs.Item onClick={() => handleTabClick('requests')} selected={tab === 'requests'}>
					{t('Requests')}
				</Tabs.Item>
			)}
			{isSecurityVisible && (
				<Tabs.Item onClick={() => handleTabClick('security')} selected={tab === 'security'}>
					{t('Security')}
				</Tabs.Item>
			)}
			{context !== 'private' && (
				<Tabs.Item onClick={() => handleTabClick('releases')} selected={tab === 'releases'}>
					{t('Releases')}
				</Tabs.Item>
			)}
			{Boolean(installed && settings && Object.values(settings).length) && isAdminUser && (
				<Tabs.Item onClick={() => handleTabClick('settings')} selected={tab === 'settings'}>
					{t('Settings')}
				</Tabs.Item>
			)}
			{Boolean(installed) && isAdminUser && isAdminUser && (
				<Tabs.Item onClick={() => handleTabClick('logs')} selected={tab === 'logs'}>
					{t('Logs')}
				</Tabs.Item>
			)}
		</Tabs>
	);
};

export default AppDetailsPageTabs;
