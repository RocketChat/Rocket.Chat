import { Tabs } from '@rocket.chat/fuselage';
import { useRouter, useRouteParameter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../components/Page';
import ChannelsTab from './tabs/channels/ChannelsTab';
import TeamsTab from './tabs/teams/TeamsTab';
import UsersTab from './tabs/users/UsersTab';

type TabName = 'users' | 'channels' | 'teams' | 'external';

const DirectoryPage = (): ReactElement => {
	const { t } = useTranslation();

	const defaultTab = useSetting<TabName>('Accounts_Directory_DefaultView', 'users');
	const federationEnabled = useSetting('FEDERATION_Enabled');
	const tab = useRouteParameter('tab') as TabName | undefined;
	const router = useRouter();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'directory') {
					return;
				}

				const { tab } = router.getRouteParameters();

				if (!tab || (tab === 'external' && !federationEnabled)) {
					router.navigate(`/directory/${defaultTab}`, { replace: true });
				}
			}),
		[router, federationEnabled, defaultTab],
	);

	const handleTabClick = useCallback((tab: TabName) => () => router.navigate(`/directory/${tab}`), [router]);

	return (
		<Page background='room'>
			<PageHeader title={t('Directory')} />
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
			<PageContent>
				{tab === 'channels' && <ChannelsTab />}
				{tab === 'users' && <UsersTab />}
				{tab === 'teams' && <TeamsTab />}
				{federationEnabled && tab === 'external' && <UsersTab workspace='external' />}
			</PageContent>
		</Page>
	);
};

export default DirectoryPage;
