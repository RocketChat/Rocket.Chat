import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouter, useRouteParameter, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ChannelsTab from './tabs/channels/ChannelsTab';
import TeamsTab from './tabs/teams/TeamsTab';
import UsersTab from './tabs/users/UsersTab';

type TabName = 'users' | 'channels' | 'teams' | 'external';

const DirectoryPage = () => {
	const { t } = useTranslation();

	const defaultTab = useSetting<TabName>('Accounts_Directory_DefaultView', 'users');
	const federationEnabled = false; // TODO old federation removed
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
				<TabsItem selected={tab === 'channels'} onClick={handleTabClick('channels')}>
					{t('Channels')}
				</TabsItem>
				<TabsItem selected={tab === 'users'} onClick={handleTabClick('users')}>
					{t('Users')}
				</TabsItem>
				<TabsItem selected={tab === 'teams'} onClick={handleTabClick('teams')}>
					{t('Teams')}
				</TabsItem>
				{federationEnabled && (
					<TabsItem selected={tab === 'external'} onClick={handleTabClick('external')}>
						{t('External_Users')}
					</TabsItem>
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
