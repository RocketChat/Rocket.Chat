import { Tabs } from '@rocket.chat/fuselage';
import { useCurrentRoute, useNavigate, useRouteParameter, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useCallback } from 'react';

import Page from '../../components/Page';
import ChannelsTab from './tabs/channels/ChannelsTab';
import TeamsTab from './tabs/teams/TeamsTab';
import UsersTab from './tabs/users/UsersTab';

type TabName = 'users' | 'channels' | 'teams' | 'external';

const DirectoryPage = (): ReactElement => {
	const t = useTranslation();

	const defaultTab = useSetting<TabName>('Accounts_Directory_DefaultView') ?? 'users';
	const federationEnabled = useSetting('FEDERATION_Enabled');
	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('tab') as TabName | undefined;
	const navigate = useNavigate();

	useEffect(() => {
		if (routeName !== 'directory') {
			return;
		}

		if (!tab || (tab === 'external' && !federationEnabled)) {
			navigate(`/directory/${defaultTab}`, { replace: true });
		}
	}, [routeName, navigate, tab, federationEnabled, defaultTab]);

	const handleTabClick = useCallback((tab: TabName) => () => navigate(`/directory/${tab}`), [navigate]);

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
				{tab === 'users' && <UsersTab />}
				{tab === 'channels' && <ChannelsTab />}
				{tab === 'teams' && <TeamsTab />}
				{federationEnabled && tab === 'external' && <UsersTab workspace='external' />}
			</Page.Content>
		</Page>
	);
};

export default DirectoryPage;
