import type { App } from '@rocket.chat/core-typings';
import { Tabs } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDetailsPageTab, type AppDetailsPageTab } from '../hooks/useAppDetailsPageTab';
import { useAppQuery } from '../hooks/useAppQuery';
import { useAppSettingsQuery } from '../hooks/useAppSettingsQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

type AppDetailsPageTabsProps = {
	appId: App['id'];
};

const AppDetailsPageTabs = ({ appId }: AppDetailsPageTabsProps): ReactElement => {
	const context = useMarketplaceContext();
	const tab = useAppDetailsPageTab();
	const canManageApps = usePermission('manage-apps');
	const router = useRouter();
	const { t } = useTranslation();
	const { isLoading, data: app } = useAppQuery(appId);
	const installed = app?.installed ?? false;
	const hasSecurity = Boolean(app?.privacyPolicySummary || app?.permissions || app?.tosLink || app?.privacyLink);
	const { data: hasSettings = false } = useAppSettingsQuery(appId, {
		select: (data) => Object.keys(data).length > 0,
	});

	const handleTabClick = (tab: AppDetailsPageTab) => {
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
			<Tabs.Item onClick={() => handleTabClick('details')} disabled={isLoading} selected={tab === 'details'}>
				{t('Details')}
			</Tabs.Item>
			{canManageApps && context !== 'private' && (
				<Tabs.Item onClick={() => handleTabClick('requests')} disabled={isLoading} selected={tab === 'requests'}>
					{t('Requests')}
				</Tabs.Item>
			)}
			{hasSecurity && (
				<Tabs.Item onClick={() => handleTabClick('security')} disabled={isLoading} selected={tab === 'security'}>
					{t('Security')}
				</Tabs.Item>
			)}
			{context !== 'private' && (
				<Tabs.Item onClick={() => handleTabClick('releases')} disabled={isLoading} selected={tab === 'releases'}>
					{t('Releases')}
				</Tabs.Item>
			)}
			{canManageApps && installed && hasSettings && (
				<Tabs.Item onClick={() => handleTabClick('settings')} disabled={isLoading} selected={tab === 'settings'}>
					{t('Settings')}
				</Tabs.Item>
			)}
			{canManageApps && installed && (
				<Tabs.Item onClick={() => handleTabClick('logs')} disabled={isLoading} selected={tab === 'logs'}>
					{t('Logs')}
				</Tabs.Item>
			)}
		</Tabs>
	);
};

export default AppDetailsPageTabs;
