import { Text } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { DescriptionList } from './DescriptionList';
import { formatMemorySize } from './formatters';

export function UsageSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <Text.Skeleton animated width={'1/2'} /> : fn());
	const t = useTranslation();

	return <>
		<h3>{t('Usage')}</h3>
		<DescriptionList>
			<DescriptionList.Entry label={t('Stats_Total_Users')}>{s(() => statistics.totalUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Active_Users')}>{s(() => statistics.activeUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Non_Active_Users')}>{s(() => statistics.nonActiveUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Connected_Users')}>{s(() => statistics.totalConnectedUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Online_Users')}>{s(() => statistics.onlineUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Away_Users')}>{s(() => statistics.awayUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Offline_Users')}>{s(() => statistics.offlineUsers)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Rooms')}>{s(() => statistics.totalRooms)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Channels')}>{s(() => statistics.totalChannels)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Private_Groups')}>{s(() => statistics.totalPrivateGroups)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Direct_Messages')}>{s(() => statistics.totalDirect)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Livechat_Rooms')}>{s(() => statistics.totalLivechat)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Total_Discussions')}>{s(() => statistics.totalDiscussions)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Total_Threads')}>{s(() => statistics.totalThreads)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Messages')}>{s(() => statistics.totalMessages)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Messages_Channel')}>{s(() => statistics.totalChannelMessages)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Messages_PrivateGroup')}>{s(() => statistics.totalPrivateGroupMessages)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Messages_Direct')}>{s(() => statistics.totalDirectMessages)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Messages_Livechat')}>{s(() => statistics.totalLivechatMessages)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Uploads')}>{s(() => statistics.uploadsTotal)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Uploads_Size')}>{s(() => formatMemorySize(statistics.uploadsTotalSize))}</DescriptionList.Entry>
			{statistics && statistics.apps && <>
					<DescriptionList.Entry label={t('Stats_Total_Installed_Apps')}>{statistics.apps.totalInstalled}</DescriptionList.Entry>
					<DescriptionList.Entry label={t('Stats_Total_Active_Apps')}>{statistics.apps.totalActive}</DescriptionList.Entry>
				</>}
			<DescriptionList.Entry label={t('Stats_Total_Integrations')}>{s(() => statistics.integrations.totalIntegrations)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncoming)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Active_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncomingActive)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoing)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Active_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoingActive)}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Stats_Total_Integrations_With_Script_Enabled')}>{s(() => statistics.integrations.totalWithScriptEnabled)}</DescriptionList.Entry>
		</DescriptionList>
	</>;
}
