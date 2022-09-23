import { Tabs } from '@rocket.chat/fuselage';
import { useCurrentRoute, useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { AppInfo } from './definitions/AppInfo';

type AppDetailsTabsProps = {
	appData: AppInfo;
	isSecurityVisible: boolean;
	isAdminSection: boolean;
};

const AppDetailsTabs = ({ appData, isSecurityVisible, isAdminSection }: AppDetailsTabsProps): ReactElement => {
	const { installed, settings, marketplace } = appData || {};

	const [routeName, urlParams] = useCurrentRoute();
	const tab = useRouteParameter('tab');
	const t = useTranslation();

	if (!routeName) {
		throw new Error('No current route name');
	}

	const router = useRoute(routeName);

	const handleTabClick = (tab: 'details' | 'security' | 'releases' | 'settings' | 'logs'): void => {
		router.replace({ ...urlParams, tab });
	};

	return (
		<Tabs>
			<Tabs.Item onClick={(): void => handleTabClick('details')} selected={!tab || tab === 'details'}>
				{t('Details')}
			</Tabs.Item>
			{Boolean(installed) && isSecurityVisible && (
				<Tabs.Item onClick={(): void => handleTabClick('security')} selected={tab === 'security'}>
					{t('Security')}
				</Tabs.Item>
			)}
			{Boolean(installed) && marketplace !== false && (
				<Tabs.Item onClick={(): void => handleTabClick('releases')} selected={tab === 'releases'}>
					{t('Releases')}
				</Tabs.Item>
			)}
			{Boolean(installed && settings && Object.values(settings).length && isAdminSection) && (
				<Tabs.Item onClick={(): void => handleTabClick('settings')} selected={tab === 'settings'}>
					{t('Settings')}
				</Tabs.Item>
			)}
			{Boolean(installed && isAdminSection) && (
				<Tabs.Item onClick={(): void => handleTabClick('logs')} selected={tab === 'logs'}>
					{t('Logs')}
				</Tabs.Item>
			)}
		</Tabs>
	);
};

export default AppDetailsTabs;
