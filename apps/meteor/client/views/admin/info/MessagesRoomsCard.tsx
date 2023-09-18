import type { IStats } from '@rocket.chat/core-typings';
import { TextSeparator, Card, CardBody, CardCol, CardColSection, CardColTitle, CardIcon } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

type MessagesRoomsCardProps = {
	statistics: IStats;
};

const MessagesRoomsCard = ({ statistics }: MessagesRoomsCardProps): ReactElement => {
	const t = useTranslation();

	return (
		<Card data-qa-id='usage-card'>
			<CardBody flexDirection='row' m='none'>
				<CardCol>
					<CardColSection mbs={0} mbe={16}>
						<CardColTitle fontScale='p2b' mbe={20}>
							{t('Messages')}
						</CardColTitle>
						<TextSeparator label={t('Total_Threads')} value={statistics.totalThreads} />
						<TextSeparator label={t('Stats_Total_Messages_Channel')} value={statistics.totalChannelMessages} />
						<TextSeparator label={t('Stats_Total_Messages_PrivateGroup')} value={statistics.totalPrivateGroupMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Direct')} value={statistics.totalDirectMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Livechat')} value={statistics.totalLivechatMessages} />
						<TextSeparator label={t('Total')} value={statistics.totalMessages} />
					</CardColSection>

					<CardColSection mb={16}>
						<CardColTitle fontScale='p2b' mbe={20}>
							{t('Total_rooms')}
						</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon name='hash' size='x16' /> {t('Channels')}
								</>
							}
							value={statistics.totalChannels}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='lock' size='x16' /> {t('Private_Groups')}
								</>
							}
							value={statistics.totalPrivateGroups}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='balloon' size='x16' /> {t('Stats_Total_Direct_Messages')}
								</>
							}
							value={statistics.totalDirect}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='discussion' size='x16' /> {t('Discussions')}
								</>
							}
							value={statistics.totalDiscussions}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='headset' size='x16' /> {t('Stats_Total_Livechat_Rooms')}
								</>
							}
							value={statistics.totalLivechat}
						/>
						<TextSeparator label={t('Total')} value={statistics.totalRooms} />
					</CardColSection>
				</CardCol>
			</CardBody>
		</Card>
	);
};

export default memo(MessagesRoomsCard);
