import type { App } from '@rocket.chat/core-typings';
import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDetailsPageTab } from '../hooks/useAppDetailsPageTab';
import { useAppSettingsQuery } from '../hooks/useAppSettingsQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

type AppDetailsPageTabsProps = {
	app: App;
};

const AppDetailsPageTabs = ({ app }: AppDetailsPageTabsProps): ReactElement => {
	const context = useMarketplaceContext();
	const [tab, changeTab] = useAppDetailsPageTab();
	const canManageApps = usePermission('manage-apps');
	const { t } = useTranslation();
	const hasSecurity = !!(app?.privacyPolicySummary || app?.permissions || app?.tosLink || app?.privacyLink);
	const { data: hasSettings = false } = useAppSettingsQuery(app.id, {
		select: (data) => Object.keys(data).length > 0,
		enabled: app?.installed ?? false,
	});

	return (
		<Tabs>
			<TabsItem onClick={() => changeTab('details')} selected={tab === 'details'}>
				{t('Details')}
			</TabsItem>
			{canManageApps && context !== 'private' && (
				<TabsItem onClick={() => changeTab('requests')} selected={tab === 'requests'}>
					{t('Requests')}
				</TabsItem>
			)}
			{hasSecurity && (
				<TabsItem onClick={() => changeTab('security')} selected={tab === 'security'}>
					{t('Security')}
				</TabsItem>
			)}
			{context !== 'private' && (
				<TabsItem onClick={() => changeTab('releases')} selected={tab === 'releases'}>
					{t('Releases')}
				</TabsItem>
			)}
			{canManageApps && app?.installed && hasSettings && (
				<TabsItem onClick={() => changeTab('settings')} selected={tab === 'settings'}>
					{t('Settings')}
				</TabsItem>
			)}
			{canManageApps && app?.installed && (
				<TabsItem onClick={() => changeTab('logs')} selected={tab === 'logs'}>
					{t('Logs')}
				</TabsItem>
			)}
		</Tabs>
	);
};

export default AppDetailsPageTabs;
