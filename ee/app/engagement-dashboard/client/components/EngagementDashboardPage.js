import { Box, Select, Tabs } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import Page from '../../../../../client/components/Page';
import UsersTab from './UsersTab';
import MessagesTab from './MessagesTab';
import ChannelsTab from './ChannelsTab';

export const EngagementDashboardPage = ({
	tab = 'users',
	onSelectTab,
}) => {
	const t = useTranslation();
	const timezoneOptions = useMemo(() => [
		['utc', t('UTC_Timezone')],
		['local', t('Local_Timezone')],
	], [t]);

	const [timezoneId, setTimezoneId] = useState('utc');
	const handleTimezoneChange = (timezoneId) => setTimezoneId(timezoneId);

	const handleTabClick = useMemo(() => (onSelectTab ? (tab) => () => onSelectTab(tab) : () => undefined), [onSelectTab]);

	return <Page>
		<Page.Header title={t('Engagement_Dashboard')}>
			<Select small options={timezoneOptions} value={timezoneId} onChange={handleTimezoneChange} />
		</Page.Header>
		<Tabs>
			<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')}</Tabs.Item>
			<Tabs.Item selected={tab === 'messages'} onClick={handleTabClick('messages')}>{t('Messages')}</Tabs.Item>
			<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')}</Tabs.Item>
		</Tabs>
		<Page.ScrollableContent padding={0}>
			<Box m='x24'>
				{(tab === 'users' && <UsersTab timezone={timezoneId}/>)
			|| (tab === 'messages' && <MessagesTab />)
			|| (tab === 'channels' && <ChannelsTab />)}
			</Box>
		</Page.ScrollableContent>
	</Page>;
};
