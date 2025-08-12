import { Box, Select, Tabs } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChannelsTab from './channels/ChannelsTab';
import MessagesTab from './messages/MessagesTab';
import UsersTab from './users/UsersTab';
import { Page, PageHeader, PageScrollableContent } from '../../../components/Page';

type EngagementDashboardPageProps = {
	tab: 'users' | 'messages' | 'channels';
	onSelectTab?: (tab: 'users' | 'messages' | 'channels') => void;
};

const EngagementDashboardPage = ({ tab = 'users', onSelectTab }: EngagementDashboardPageProps): ReactElement => {
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
				<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>
					{t('Users')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'messages'} onClick={handleTabClick('messages')}>
					{t('Messages')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>
					{t('Channels')}
				</Tabs.Item>
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
