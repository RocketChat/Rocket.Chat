import type { IStats } from '@rocket.chat/core-typings';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useHasLicense } from '../../../../ee/client/hooks/useHasLicense';
import Card from '../../../components/Card';
import { UserStatus } from '../../../components/UserStatus';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';
import TextSeparator from './TextSeparator';

type UsageCardProps = {
	statistics: IStats;
	vertical: boolean;
};

const UsageCard = ({ statistics, vertical }: UsageCardProps): ReactElement => {
	const t = useTranslation();
	const formatMemorySize = useFormatMemorySize();

	const router = useRoute('engagement-dashboard');

	const handleEngagement = useMutableCallback(() => {
		router.push();
	});

	const canViewEngagement = useHasLicense('engagement-dashboard');

	return (
		<Card data-qa-id='usage-card'>
			<Card.Title>{t('Usage')}</Card.Title>
			<Card.Body flexDirection={vertical ? 'column' : 'row'}>
				<Card.Col>
					<Card.Col.Section>
						<Card.Col.Title>{t('Users')}</Card.Col.Title>
						<TextSeparator
							label={
								<>
									<Card.Icon name='dialpad' /> {t('Total')}
								</>
							}
							value={statistics.totalUsers}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon>
										<UserStatus status='online' />
									</Card.Icon>{' '}
									{t('Online')}
								</>
							}
							value={statistics.onlineUsers}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon>
										<UserStatus status='busy' />
									</Card.Icon>{' '}
									{t('Busy')}
								</>
							}
							value={statistics.busyUsers}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon>
										<UserStatus status='away' />
									</Card.Icon>{' '}
									{t('Away')}
								</>
							}
							value={statistics.awayUsers}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon>
										<UserStatus status='offline' />
									</Card.Icon>{' '}
									{t('Offline')}
								</>
							}
							value={statistics.offlineUsers}
						/>
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Types_and_Distribution')}</Card.Col.Title>
						<TextSeparator label={t('Connected')} value={statistics.totalConnectedUsers} />
						<TextSeparator label={t('Stats_Active_Users')} value={statistics.activeUsers} />
						<TextSeparator label={t('Stats_Active_Guests')} value={statistics.activeGuests} />
						<TextSeparator label={t('Stats_Non_Active_Users')} value={statistics.nonActiveUsers} />
						<TextSeparator label={t('Stats_App_Users')} value={statistics.appUsers} />
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Uploads')}</Card.Col.Title>
						<TextSeparator label={t('Stats_Total_Uploads')} value={statistics.uploadsTotal} />
						<TextSeparator label={t('Stats_Total_Uploads_Size')} value={formatMemorySize(statistics.uploadsTotalSize)} />
					</Card.Col.Section>
				</Card.Col>
				<Card.Divider />
				<Card.Col>
					<Card.Col.Section>
						<Card.Col.Title>{t('Total_rooms')}</Card.Col.Title>
						<TextSeparator
							label={
								<>
									<Card.Icon name='dialpad' size='x16' /> {t('Stats_Total_Rooms')}
								</>
							}
							value={statistics.totalRooms}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon name='hash' size='x16' /> {t('Stats_Total_Channels')}
								</>
							}
							value={statistics.totalChannels}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon name='lock' size='x16' /> {t('Stats_Total_Private_Groups')}
								</>
							}
							value={statistics.totalPrivateGroups}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon name='balloon' size='x16' /> {t('Stats_Total_Direct_Messages')}
								</>
							}
							value={statistics.totalDirect}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon name='discussion' size='x16' /> {t('Total_Discussions')}
								</>
							}
							value={statistics.totalDiscussions}
						/>
						<TextSeparator
							label={
								<>
									<Card.Icon name='headset' size='x16' /> {t('Stats_Total_Livechat_Rooms')}
								</>
							}
							value={statistics.totalLivechat}
						/>
					</Card.Col.Section>
					<Card.Col.Section>
						<Card.Col.Title>{t('Total_messages')}</Card.Col.Title>
						<TextSeparator label={t('Stats_Total_Messages')} value={statistics.totalMessages} />
						<TextSeparator label={t('Total_Threads')} value={statistics.totalThreads} />
						<TextSeparator label={t('Stats_Total_Messages_Channel')} value={statistics.totalChannelMessages} />
						<TextSeparator label={t('Stats_Total_Messages_PrivateGroup')} value={statistics.totalPrivateGroupMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Direct')} value={statistics.totalDirectMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Livechat')} value={statistics.totalLivechatMessages} />
					</Card.Col.Section>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<Button disabled={!canViewEngagement} small onClick={handleEngagement}>
						{t('See_on_Engagement_Dashboard')}
					</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default memo(UsageCard);
