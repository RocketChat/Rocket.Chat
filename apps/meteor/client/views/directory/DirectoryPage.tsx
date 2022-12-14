import { Tabs } from '@rocket.chat/fuselage';
import { useCurrentRoute, useRoute, useRouteParameter, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useCallback } from 'react';

import Page from '../../components/Page';
import ChannelsTab from './ChannelsTab';
import TeamsTab from './TeamsTab';
import UserTab from './UserTab';

function DirectoryPage(): ReactElement {
	const t = useTranslation();

	const defaultTab = String(useSetting('Accounts_Directory_DefaultView'));
	const federationEnabled = useSetting('FEDERATION_Enabled');
	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('tab');
	const directoryRoute = useRoute('directory');

	useEffect(() => {
		if (routeName !== 'directory') {
			return;
		}

		if (!tab || (tab === 'external' && !federationEnabled)) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [routeName, directoryRoute, tab, federationEnabled, defaultTab]);

	const handleTabClick = useCallback((tab) => (): void => directoryRoute.push({ tab }), [directoryRoute]);

	return (
		<Page>
			<Page.Header title={t('Directory')} />
			<Tabs flexShrink={0}>
				<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>
					{t('Channels')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>
					{t('Users')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'teams'} onClick={handleTabClick('teams')}>
					{t('Teams')}
				</Tabs.Item>
				{federationEnabled && (
					<Tabs.Item selected={tab === 'external'} onClick={handleTabClick('external')}>
						{t('External_Users')}
					</Tabs.Item>
				)}
			</Tabs>
			<Page.Content>
				{tab === 'users' && <UserTab />}
				{tab === 'channels' && <ChannelsTab />}
				{tab === 'teams' && <TeamsTab />}
				{federationEnabled && tab === 'external' && <UserTab workspace='external' />}
			</Page.Content>
		</Page>
	);
}

DirectoryPage.displayName = 'DirectoryPage';

export default DirectoryPage;
