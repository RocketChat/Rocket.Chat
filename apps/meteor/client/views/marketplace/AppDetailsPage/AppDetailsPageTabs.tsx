import { Tabs } from '@rocket.chat/fuselage';
import { useCurrentRoute, usePermission, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import type { ISettings } from '../../../../ee/client/apps/@types/IOrchestrator';

type AppDetailsPageTabsProps = {
	context: string;
	installed: boolean | undefined;
	isSecurityVisible: boolean;
	settings: ISettings | undefined;
	tab: string | undefined;
};

const AppDetailsPageTabs = ({ context, installed, isSecurityVisible, settings, tab }: AppDetailsPageTabsProps): ReactElement => {
	const t = useTranslation();
	const isAdminUser = usePermission('manage-apps');

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const [, urlParams] = useCurrentRoute();
	const handleTabClick = (tab: 'details' | 'security' | 'releases' | 'settings' | 'logs' | 'requests'): void => {
		router.replace({ ...urlParams, tab });
	};

	return (
		<Tabs>
			<Tabs.Item onClick={(): void => handleTabClick('details')} selected={!tab || tab === 'details'}>
				{t('Details')}
			</Tabs.Item>
			{isAdminUser && context !== 'private' && (
				<Tabs.Item onClick={(): void => handleTabClick('requests')} selected={tab === 'requests'}>
					{t('Requests')}
				</Tabs.Item>
			)}
			{isSecurityVisible && (
				<Tabs.Item onClick={(): void => handleTabClick('security')} selected={tab === 'security'}>
					{t('Security')}
				</Tabs.Item>
			)}
			{context !== 'private' && (
				<Tabs.Item onClick={(): void => handleTabClick('releases')} selected={tab === 'releases'}>
					{t('Releases')}
				</Tabs.Item>
			)}
			{Boolean(installed && settings && Object.values(settings).length) && isAdminUser && (
				<Tabs.Item onClick={(): void => handleTabClick('settings')} selected={tab === 'settings'}>
					{t('Settings')}
				</Tabs.Item>
			)}
			{Boolean(installed) && isAdminUser && isAdminUser && (
				<Tabs.Item onClick={(): void => handleTabClick('logs')} selected={tab === 'logs'}>
					{t('Logs')}
				</Tabs.Item>
			)}
		</Tabs>
	);
};

export default AppDetailsPageTabs;
