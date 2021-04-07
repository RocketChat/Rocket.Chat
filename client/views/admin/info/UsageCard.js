import React from 'react';
import { Box, Skeleton, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import DotLeader from '../../../components/DotLeader';
import Card from '../../../components/Card/Card';
import { UserStatus } from '../../../components/UserStatus';
import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useHasLicense } from '../../../../ee/client/hooks/useHasLicense';

const TextSeparator = ({ label, value }) => <Box display='flex' flexDirection='row' mb='x4'>
	<Box display='inline-flex' alignItems='center'>{label}</Box>
	<DotLeader />
	<span>{value}</span>
</Box>;

const UsageCard = React.memo(function UsageCard({ statistics, isLoading, vertical }) {
	const s = (fn) => (isLoading ? <Skeleton width='x40' /> : fn());
	const t = useTranslation();
	const formatMemorySize = useFormatMemorySize();

	const router = useRoute('engagement-dashboard');

	const handleEngagement = useMutableCallback(() => {
		router.push();
	});

	const canViewEngagement = useHasLicense('engagement-dashboard');

	return <Card>
		<Card.Title>{t('Usage')}</Card.Title>
		<Card.Body flexDirection={vertical ? 'column' : 'row' }>
			<Card.Col>
				<Card.Col.Section>
					<Card.Col.Title>{t('Users')}</Card.Col.Title>
					<TextSeparator
						label={<><Card.Icon name='dialpad'/> {t('Total')}</>}
						value={s(() => statistics.totalUsers)}
					/>
					<TextSeparator
						label={<><Card.Icon><UserStatus status='online'/></Card.Icon> {t('Online')}</>}
						value={s(() => statistics.onlineUsers)}
					/>
					<TextSeparator
						label={<><Card.Icon><UserStatus status='busy'/></Card.Icon> {t('Busy')}</>}
						value={s(() => statistics.busyUsers)}
					/>
					<TextSeparator
						label={<><Card.Icon><UserStatus status='away'/></Card.Icon> {t('Away')}</>}
						value={s(() => statistics.awayUsers)}
					/>
					<TextSeparator
						label={<><Card.Icon><UserStatus status='offline'/></Card.Icon> {t('Offline')}</>}
						value={s(() => statistics.offlineUsers)}
					/>
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Types_and_Distribution')}</Card.Col.Title>
					<TextSeparator
						label={t('Connected')}
						value={s(() => statistics.totalConnectedUsers)}
					/>
					<TextSeparator
						label={t('Stats_Active_Users')}
						value={s(() => statistics.activeUsers)}
					/>
					<TextSeparator
						label={t('Stats_Active_Guests')}
						value={s(() => statistics.activeGuests)}
					/>
					<TextSeparator
						label={t('Stats_Non_Active_Users')}
						value={s(() => statistics.nonActiveUsers)}
					/>
					<TextSeparator
						label={t('Stats_App_Users')}
						value={s(() => statistics.appUsers)}
					/>
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Uploads')}</Card.Col.Title>
					<TextSeparator
						label={t('Stats_Total_Uploads')}
						value={s(() => statistics.uploadsTotal)}
					/>
					<TextSeparator
						label={t('Stats_Total_Uploads_Size')}
						value={s(() => formatMemorySize(statistics.uploadsTotalSize))}
					/>
				</Card.Col.Section>
			</Card.Col>
			<Card.Divider />
			<Card.Col>
				<Card.Col.Section>
					<Card.Col.Title>{t('Rooms')}</Card.Col.Title>
					<TextSeparator
						label={<><Card.Icon name='dialpad' size='x16'/> {t('Stats_Total_Rooms')}</>}
						value={s(() => statistics.totalRooms)}
					/>
					<TextSeparator
						label={<><Card.Icon name='hash' size='x16'/> {t('Stats_Total_Channels')}</>}
						value={s(() => statistics.totalChannels)}
					/>
					<TextSeparator
						label={<><Card.Icon name='lock' size='x16'/> {t('Stats_Total_Private_Groups')}</>}
						value={s(() => statistics.totalPrivateGroups)}
					/>
					<TextSeparator
						label={<><Card.Icon name='balloon' size='x16'/> {t('Stats_Total_Direct_Messages')}</>}
						value={s(() => statistics.totalDirect)}
					/>
					<TextSeparator
						label={<><Card.Icon name='discussion' size='x16'/> {t('Total_Discussions')}</>}
						value={s(() => statistics.totalDiscussions)}
					/>
					<TextSeparator
						label={<><Card.Icon name='headset' size='x16'/> {t('Stats_Total_Livechat_Rooms')}</>}
						value={s(() => statistics.totalLivechat)}
					/>
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Messages')}</Card.Col.Title>
					<TextSeparator
						label={t('Stats_Total_Messages')}
						value={s(() => statistics.totalMessages)}
					/>
					<TextSeparator
						label={t('Total_Threads')}
						value={s(() => statistics.totalThreads)}
					/>
					<TextSeparator
						label={t('Stats_Total_Messages_Channel')}
						value={s(() => statistics.totalChannelMessages)}
					/>
					<TextSeparator
						label={t('Stats_Total_Messages_PrivateGroup')}
						value={s(() => statistics.totalPrivateGroupMessages)}
					/>
					<TextSeparator
						label={t('Stats_Total_Messages_Direct')}
						value={s(() => statistics.totalDirectMessages)}
					/>
					<TextSeparator
						label={t('Stats_Total_Messages_Livechat')}
						value={s(() => statistics.totalLivechatMessages)}
					/>
				</Card.Col.Section>
			</Card.Col>
		</Card.Body>
		<Card.Footer>
			<ButtonGroup align='end'>
				<Button disabled={!canViewEngagement} small onClick={handleEngagement}>{t('See_on_Engagement_Dashboard')}</Button>
			</ButtonGroup>
		</Card.Footer>
	</Card>;
});

export default UsageCard;
