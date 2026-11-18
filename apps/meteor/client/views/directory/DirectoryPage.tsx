import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useRouter, useRouteParameter, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import ChannelsTab from './tabs/channels/ChannelsTab';
import TeamsTab from './tabs/teams/TeamsTab';
import UsersTab from './tabs/users/UsersTab';
import { PageTabs } from '../../components/PageTabs';

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

	return (
		<Page background='room'>
			<PageHeader title={t('Directory')} />
			<PageTabs<TabName>
				items={[
					{ id: 'channels', label: t('Channels') },
					{ id: 'users', label: t('Users') },
					{ id: 'teams', label: t('Teams') },
					{ id: 'external', label: t('External_Users'), hidden: !federationEnabled },
				]}
				selected={tab}
				onSelect={(tab) => router.navigate(`/directory/${tab}`)}
			/>
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
