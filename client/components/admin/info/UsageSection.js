import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { SkeletonText } from './SkeletonText';
import { formatMemorySize } from './formatters';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export function UsageSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();

	if (!statistics) {
		return null;
	}

	return <>
		<h3>{t('Usage')}</h3>
		<InformationList>
			<InformationEntry label={t('Stats_Total_Users')}>{s(() => statistics.totalUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Active_Users')}>{s(() => statistics.activeUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Non_Active_Users')}>{s(() => statistics.nonActiveUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Connected_Users')}>{s(() => statistics.totalConnectedUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Online_Users')}>{s(() => statistics.onlineUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Away_Users')}>{s(() => statistics.awayUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Offline_Users')}>{s(() => statistics.offlineUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Rooms')}>{s(() => statistics.totalRooms)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Channels')}>{s(() => statistics.totalChannels)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Private_Groups')}>{s(() => statistics.totalPrivateGroups)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Direct_Messages')}>{s(() => statistics.totalDirect)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Livechat_Rooms')}>{s(() => statistics.totalLivechat)}</InformationEntry>
			<InformationEntry label={t('Total_Discussions')}>{s(() => statistics.totalDiscussions)}</InformationEntry>
			<InformationEntry label={t('Total_Threads')}>{s(() => statistics.totalThreads)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages')}>{s(() => statistics.totalMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Channel')}>{s(() => statistics.totalChannelMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_PrivateGroup')}>{s(() => statistics.totalPrivateGroupMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Direct')}>{s(() => statistics.totalDirectMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Livechat')}>{s(() => statistics.totalLivechatMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Uploads')}>{s(() => statistics.uploadsTotal)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Uploads_Size')}>{s(() => formatMemorySize(statistics.uploadsTotalSize))}</InformationEntry>
			{statistics.apps && <>
					<InformationEntry label={t('Stats_Total_Installed_Apps')}>{statistics.apps.totalInstalled}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Active_Apps')}>{statistics.apps.totalActive}</InformationEntry>
				</>}
			<InformationEntry label={t('Stats_Total_Integrations')}>{s(() => statistics.integrations.totalIntegrations)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncoming)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Active_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncomingActive)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoing)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Active_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoingActive)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Integrations_With_Script_Enabled')}>{s(() => statistics.integrations.totalWithScriptEnabled)}</InformationEntry>
		</InformationList>
	</>;
}
