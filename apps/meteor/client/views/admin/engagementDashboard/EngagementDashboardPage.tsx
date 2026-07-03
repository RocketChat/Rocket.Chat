import { Box, Select, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { PageScrollableContent, Page, PageHeader } from '@rocket.chat/ui-client';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChannelsTab from './channels/ChannelsTab';
import MessagesTab from './messages/MessagesTab';
import UsersTab from './users/UsersTab';

type EngagementDashboardPageProps = {
	tab: 'users' | 'messages' | 'channels';
	onSelectTab?: (tab: 'users' | 'messages' | 'channels') => void;
};

const EngagementDashboardPage = ({ tab = 'users', onSelectTab }: EngagementDashboardPageProps) => {
	const { t } = useTranslation();

	const timezoneOptions = useMemo<[timezone: 'utc' | 'local', label: string][]>(
		() => [
			['utc', t('UTC_Timezone')],
			['local', t('Local_Timezone')],
		],
		[t],
	);

	const [timezoneId, setTimezoneId] = useState<'utc' | 'local'>('utc');
	const handleTimezoneChange = (timezoneId: string): void => setTimezoneId(timezoneId as 'utc' | 'local');

	const handleTabClick = useCallback(
		(tab: 'users' | 'messages' | 'channels'): undefined | (() => void) => (onSelectTab ? (): void => onSelectTab(tab) : undefined),
		[onSelectTab],
	);

	return (
		<Page background='tint'>
			<PageHeader title={t('Engagement')}>
				<Select
					options={timezoneOptions}
					value={timezoneId}
					onChange={(value) => handleTimezoneChange(String(value))}
					aria-label={t('Default_Timezone_For_Reporting')}
				/>
			</PageHeader>
			<Tabs>
				<TabsItem selected={tab === 'users'} onClick={handleTabClick('users')}>
					{t('Users')}
				</TabsItem>
				<TabsItem selected={tab === 'messages'} onClick={handleTabClick('messages')}>
					{t('Messages')}
				</TabsItem>
				<TabsItem selected={tab === 'channels'} onClick={handleTabClick('channels')}>
					{t('Channels')}
				</TabsItem>
			</Tabs>
			<PageScrollableContent padding={0}>
				<Box m={24}>
					{(tab === 'users' && <UsersTab timezone={timezoneId} />) ||
						(tab === 'messages' && <MessagesTab timezone={timezoneId} />) ||
						(tab === 'channels' && <ChannelsTab />)}
				</Box>
			</PageScrollableContent>
		</Page>
	);
};

export default EngagementDashboardPage;
