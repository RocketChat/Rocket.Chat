import type { IStats } from '@rocket.chat/core-typings';
import { Card } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import WorkspaceCardSection from '../components/WorkspaceCardSection';
import WorkspaceCardSectionTitle from '../components/WorkspaceCardSectionTitle';
import WorkspaceCardTextSeparator from '../components/WorkspaceCardTextSeparator';

type MessagesRoomsCardProps = {
	statistics: IStats;
};

const MessagesRoomsCard = ({ statistics }: MessagesRoomsCardProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Card height='full'>
			<WorkspaceCardSection>
				<WorkspaceCardSectionTitle title={t('Total_rooms')} variant='h4' />

				<WorkspaceCardTextSeparator label={t('Channels')} icon='hash' value={statistics.totalChannels} />
				<WorkspaceCardTextSeparator label={t('Private_Groups')} icon='lock' value={statistics.totalPrivateGroups} />
				<WorkspaceCardTextSeparator label={t('Direct_Messages')} icon='balloon' value={statistics.totalDirect} />
				<WorkspaceCardTextSeparator label={t('Discussions')} icon='discussion' value={statistics.totalDiscussions} />
				<WorkspaceCardTextSeparator label={t('Omnichannel')} icon='headset' value={statistics.totalLivechat} />
				<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalRooms} />
			</WorkspaceCardSection>

			<WorkspaceCardSection>
				<WorkspaceCardSectionTitle title={t('Messages')} variant='h4' />
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
				<WorkspaceCardTextSeparator label={t('Stats_Total_Messages_Livechat')} icon='headset' value={statistics.totalLivechatMessages} />
				<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalMessages} />
			</WorkspaceCardSection>
		</Card>
	);
};

export default memo(MessagesRoomsCard);
