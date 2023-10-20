import type { IStats } from '@rocket.chat/core-typings';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	Card,
	CardBody,
	CardCol,
	CardTitle,
	CardColSection,
	CardColTitle,
	CardFooter,
	TextSeparator,
	CardIcon,
} from '@rocket.chat/ui-client';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { UserStatus } from '../../../components/UserStatus';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';

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

	const canViewEngagement = useHasLicenseModule('engagement-dashboard');

	return (
		<Card data-qa-id='usage-card'>
			<CardTitle>{t('Usage')}</CardTitle>
			<CardBody flexDirection={vertical ? 'column' : 'row'}>
				<CardCol>
					<CardColSection>
						<CardColTitle>{t('Users')}</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon name='dialpad' /> {t('Total')}
								</>
							}
							value={statistics.totalUsers}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon>
										<UserStatus status='online' />
									</CardIcon>{' '}
									{t('Online')}
								</>
							}
							value={statistics.onlineUsers}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon>
										<UserStatus status='busy' />
									</CardIcon>{' '}
									{t('Busy')}
								</>
							}
							value={statistics.busyUsers}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon>
										<UserStatus status='away' />
									</CardIcon>{' '}
									{t('Away')}
								</>
							}
							value={statistics.awayUsers}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon>
										<UserStatus status='offline' />
									</CardIcon>{' '}
									{t('Offline')}
								</>
							}
							value={statistics.offlineUsers}
						/>
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Types_and_Distribution')}</CardColTitle>
						<TextSeparator label={t('Connected')} value={statistics.totalConnectedUsers} />
						<TextSeparator label={t('Stats_Active_Users')} value={statistics.activeUsers} />
						<TextSeparator label={t('Stats_Active_Guests')} value={statistics.activeGuests} />
						<TextSeparator label={t('Stats_Non_Active_Users')} value={statistics.nonActiveUsers} />
						<TextSeparator label={t('Stats_App_Users')} value={statistics.appUsers} />
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Uploads')}</CardColTitle>
						<TextSeparator label={t('Stats_Total_Uploads')} value={statistics.uploadsTotal} />
						<TextSeparator label={t('Stats_Total_Uploads_Size')} value={formatMemorySize(statistics.uploadsTotalSize)} />
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Total_rooms')}</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon name='dialpad' size='x16' /> {t('Stats_Total_Rooms')}
								</>
							}
							value={statistics.totalRooms}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='hash' size='x16' /> {t('Stats_Total_Channels')}
								</>
							}
							value={statistics.totalChannels}
						/>
						<TextSeparator
							label={
								<>
									<CardIcon name='lock' size='x16' /> {t('Stats_Total_Private_Groups')}
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
									<CardIcon name='discussion' size='x16' /> {t('Total_Discussions')}
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
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Total_messages')}</CardColTitle>
						<TextSeparator label={t('Stats_Total_Messages')} value={statistics.totalMessages} />
						<TextSeparator label={t('Total_Threads')} value={statistics.totalThreads} />
						<TextSeparator label={t('Stats_Total_Messages_Channel')} value={statistics.totalChannelMessages} />
						<TextSeparator label={t('Stats_Total_Messages_PrivateGroup')} value={statistics.totalPrivateGroupMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Direct')} value={statistics.totalDirectMessages} />
						<TextSeparator label={t('Stats_Total_Messages_Livechat')} value={statistics.totalLivechatMessages} />
					</CardColSection>
				</CardCol>
			</CardBody>
			<CardFooter>
				<ButtonGroup align='end'>
					<Button disabled={!canViewEngagement} small onClick={handleEngagement}>
						{t('See_on_Engagement_Dashboard')}
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
};

export default memo(UsageCard);
