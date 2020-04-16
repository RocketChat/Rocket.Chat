import React, { useEffect, useCallback } from 'react';
import { Box, Margins, Tabs, Avatar } from '@rocket.chat/fuselage';

import { Page } from '../../../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { UserTab } from './UserTab';
import { ChannelsTab } from './ChannelsTab';
import { useRoute, useRouteParameter } from '../../../../../../../client/contexts/RouterContext';
import { useSetting } from '../../../../../../../client/contexts/SettingsContext';

const style = { padding: 0 };
const avatarBase = { baseUrl: '/avatar/' };
export function DirectoryPage() {
	const t = useTranslation();

	const defaultTab = useSetting('Accounts_Directory_DefaultView');

	const federationEnabled = useSetting('FEDERATION_Enabled');

	const tab = useRouteParameter('tab');

	const directoryRoute = useRoute('directory');
	const handleTabClick = useCallback((tab) => () => directoryRoute.push({ tab }), [tab]);

	useEffect(() => {
		if (!tab || (tab === 'external' && !federationEnabled)) {
			return directoryRoute.replace({ tab: defaultTab });
		}
	}, [directoryRoute, tab, federationEnabled, defaultTab]);

	return <Avatar.Context.Provider value={avatarBase}><Page>
		<Page.Header title={t('Directory')} />
		<Tabs flexShrink={0} >
			<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
			<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
			{ federationEnabled && <Tabs.Item selected={tab === 'external'} onClick={handleTabClick('external')}>{t('External_Users')}</Tabs.Item> }
		</Tabs>
		<Page.Content style={style}>
			<Margins inline='x24'>
				<Box>
					{
						(tab === 'users' && <UserTab />)
					|| (tab === 'channels' && <ChannelsTab />)
					|| (federationEnabled && tab === 'external' && <UserTab workspace='external' />)
					}
				</Box>
			</Margins>
		</Page.Content>
	</Page></Avatar.Context.Provider>;
}


DirectoryPage.displayName = 'DirectoryPage';

export default DirectoryPage;
