import { Box, Margins, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';
import { UsersTab } from './UsersTab';
import { MessagesTab } from './MessagesTab';
import { ChannelsTab } from './ChannelsTab';

export function EngagementDashboardPage() {
	const t = useTranslation();
	const [activeTab, setActiveTab] = useState('users');
	const engagementDashboardRoute = useRoute('engagement-dashboard');

	useEffect(() => {
		engagementDashboardRoute(activeTab);
	}, [activeTab, engagementDashboardRoute]);

	const handleTabClick = (tab) => () => {
		setActiveTab(tab);
	};

	return <Page>
		<Page.Header title={t('Engagement Dashboard')} />
		<Page.Content style={{ padding: 0 }}>
			<Margins block='x24'>
				<Tabs>
					<Tabs.Item selected={activeTab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
					<Tabs.Item selected={activeTab === 'messages'} onClick={handleTabClick('messages')}>{t('Messages')}</Tabs.Item>
					<Tabs.Item selected={activeTab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
				</Tabs>
			</Margins>
			<Margins all='x24'>
				<Box>
					{(activeTab === 'users' && <UsersTab />)
				|| (activeTab === 'messages' && <MessagesTab />)
				|| (activeTab === 'channels' && <ChannelsTab />)}
				</Box>
			</Margins>
		</Page.Content>
	</Page>;
}
