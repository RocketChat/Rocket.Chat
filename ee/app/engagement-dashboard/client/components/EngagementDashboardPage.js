import { Box, Tabs } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import Page from '../../../../../client/components/basic/Page';
import { UsersTab } from './UsersTab';
import { MessagesTab } from './MessagesTab';
import { ChannelsTab } from './ChannelsTab';

export function EngagementDashboardPage({
	tab = 'users',
	onSelectTab,
}) {
	const t = useTranslation();

	const handleTabClick = useMemo(() => (onSelectTab ? (tab) => () => onSelectTab(tab) : () => undefined), [onSelectTab]);

	return <Page>
		<Page.Header title={t('Engagement_Dashboard')} />
		<Tabs>
			<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
			<Tabs.Item selected={tab === 'messages'} onClick={handleTabClick('messages')}>{t('Messages')}</Tabs.Item>
			<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
		</Tabs>
		<Page.ScrollableContent padding={0}>
			<Box m='x24'>
				{(tab === 'users' && <UsersTab />)
			|| (tab === 'messages' && <MessagesTab />)
			|| (tab === 'channels' && <ChannelsTab />)}
			</Box>
		</Page.ScrollableContent>
	</Page>;
}
