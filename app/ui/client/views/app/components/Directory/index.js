import React, { useMemo, useEffect } from 'react';
import { Box, Margins, Tabs } from '@rocket.chat/fuselage';

import { Page } from '../../../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { UserTab } from './UserTab';
import { ChannelsTab } from './ChannelsTab';
import { useRoute, useRouteParameter } from '../../../../../../../client/contexts/RouterContext';
import { useSetting } from '../../../../../../../client/contexts/SettingsContext';

export function DirectoryPage() {
	const t = useTranslation();

	const federationEnabled = useSetting('FEDERATION_Enabled');

	const tab = useRouteParameter('tab');

	const goToDirectory = useRoute('directory');
	const handleTabClick = useMemo(() => (tab) => () => goToDirectory({ tab }), [tab]);

	useEffect(() => {
		if (!tab || (tab === 'external' && !federationEnabled)) {
			return goToDirectory.replacingState({ tab: 'channels' });
		}
	}, [tab, federationEnabled]);

	return <Page>
		<Page.Header title={t('Directory')} />
		<Page.Content style={{ padding: 0 }}>
			<Tabs>
				<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
				<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
				{ federationEnabled && <Tabs.Item selected={tab === 'external'} onClick={handleTabClick('external')}>{t('External_Users')}</Tabs.Item> }
			</Tabs>
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
	</Page>;
}


DirectoryPage.name = 'DirectoryPage';
