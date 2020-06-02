import { Box, Margins, Tabs } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import Page from '../../../../../client/components/basic/Page';
import { UsersTab } from './UsersTab';
import { MessagesTab } from './MessagesTab';
import { ChannelsTab } from './ChannelsTab';

const style = { padding: 0 };

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
		<Page.Content style={style}>
			<Margins all='x24'>
				<Box>
					{(tab === 'users' && <UsersTab />)
				|| (tab === 'messages' && <MessagesTab />)
				|| (tab === 'channels' && <ChannelsTab />)}
				</Box>
			</Margins>
		</Page.Content>
	</Page>;
}
