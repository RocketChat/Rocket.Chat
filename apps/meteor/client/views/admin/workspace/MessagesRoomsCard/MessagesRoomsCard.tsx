import type { IStats } from '@rocket.chat/core-typings';
import { Card } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import WorkspaceCardSection from '../components/WorkspaceCardSection';
import WorkspaceCardTextSeparator from '../components/WorkspaceCardTextSeparator';

type MessagesRoomsCardProps = {
	statistics: IStats;
};

const MessagesRoomsCard = ({ statistics }: MessagesRoomsCardProps): ReactElement => {
	const t = useTranslation();

	return (
		<Card height='full'>
			<WorkspaceCardSection
				title={t('Total_rooms')}
				body={
					<>
						<WorkspaceCardTextSeparator label={t('Channels')} icon='hash' value={statistics.totalChannels} />
						<WorkspaceCardTextSeparator label={t('Private_Groups')} icon='lock' value={statistics.totalPrivateGroups} />
						<WorkspaceCardTextSeparator label={t('Direct_Messages')} icon='balloon' value={statistics.totalDirect} />
						<WorkspaceCardTextSeparator label={t('Discussions')} icon='discussion' value={statistics.totalDiscussions} />
						<WorkspaceCardTextSeparator label={t('Omnichannel')} icon='headset' value={statistics.totalLivechat} />
						<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalRooms} />
					</>
				}
			/>

			<WorkspaceCardSection
				title={t('Messages')}
				body={
					<>
						<WorkspaceCardTextSeparator label={t('Stats_Total_Messages_Channel')} icon='hash' value={statistics.totalChannelMessages} />
						<WorkspaceCardTextSeparator
							label={t('Stats_Total_Messages_PrivateGroup')}
							icon='lock'
							value={statistics.totalPrivateGroupMessages}
						/>
						<WorkspaceCardTextSeparator label={t('Stats_Total_Messages_Direct')} icon='balloon' value={statistics.totalDirectMessages} />
						<WorkspaceCardTextSeparator
							label={t('Stats_Total_Messages_Discussions')}
							icon='discussion'
							value={statistics.totalDiscussionsMessages}
						/>
						<WorkspaceCardTextSeparator
							label={t('Stats_Total_Messages_Livechat')}
							icon='headset'
							value={statistics.totalLivechatMessages}
						/>
						<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalMessages} />
					</>
				}
			/>
		</Card>
	);
};

export default memo(MessagesRoomsCard);
