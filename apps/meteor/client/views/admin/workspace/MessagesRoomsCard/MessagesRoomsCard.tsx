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
		<Card>
			<CardBody>
				<CardCol>
					<CardColSection mbs={0} mbe={16}>
						<CardColTitle>{t('Total_rooms')}</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon name='hash' size='x16' mie={4} />
									{t('Channels')}
								</>
							}
							value={statistics.totalChannels}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='lock' size='x16' mie={4} />
									{t('Private_Groups')}
								</>
							}
							value={statistics.totalPrivateGroups}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='balloon' size='x16' mie={4} />
									{t('Direct_Messages')}
								</>
							}
							value={statistics.totalDirect}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='discussion' size='x16' mie={4} />
									{t('Discussions')}
								</>
							}
							value={statistics.totalDiscussions}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='headset' size='x16' mie={4} />
									{t('Omnichannel')}
								</>
							}
							value={statistics.totalLivechat}
						/>
						<TextSeparator label={t('Total')} value={statistics.totalRooms} />
					</CardColSection>

					<CardColSection mbs={0} mbe={16}>
						<CardColTitle>{t('Messages')}</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon name='hash' size='x16' mie={4} />
									{t('Stats_Total_Messages_Channel')}
								</>
							}
							value={statistics.totalChannelMessages}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='lock' size='x16' mie={4} />
									{t('Stats_Total_Messages_PrivateGroup')}
								</>
							}
							value={statistics.totalPrivateGroupMessages}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='balloon' size='x16' mie={4} />
									{t('Stats_Total_Messages_Direct')}
								</>
							}
							value={statistics.totalDirectMessages}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='discussion' size='x16' mie={4} />
									{t('Stats_Total_Messages_Discussions')}
								</>
							}
							value={statistics.totalDiscussionsMessages}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='headset' size='x16' mie={4} />
									{t('Stats_Total_Messages_Livechat')}
								</>
							}
							value={statistics.totalLivechatMessages}
						/>
						<TextSeparator label={t('Total')} value={statistics.totalMessages} />
					</CardColSection>
				</CardCol>
			</CardBody>
		</Card>
	);
};

export default memo(MessagesRoomsCard);
