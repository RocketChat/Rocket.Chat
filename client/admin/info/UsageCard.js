import React from 'react';
import { Box, Skeleton, Icon, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import DotLeader from '../../components/basic/DotLeader';
import Card from '../../components/basic/Card/Card';
import { UserStatus } from '../../components/basic/UserStatus';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useHasLicense } from '../../../ee/client/hooks/useHasLicense';

const TextSeparator = ({ label, value }) => <Box display='flex' flexDirection='row' mb='x4'>
	<span>{label}</span>
	<DotLeader />
	<span>{value}</span>
</Box>;

const UsageCard = React.memo(function UsageCard({ statistics, isLoading }) {
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
		<Card.Body>
			<Card.Col>
				<Card.Col.Section>
					<Card.Col.Title>{t('Users')}</Card.Col.Title>
					<TextSeparator
						label={<span><Icon name='dialpad' size='x16'/> {t('Total')}</span>}
						value={s(() => statistics.totalUsers)}
					/>
					<TextSeparator
						label={<span><UserStatus status='online'/> {t('Online')}</span>}
						value={s(() => statistics.onlineUsers)}
					/>
					<TextSeparator
						label={<span><UserStatus status='busy'/> {t('Busy')}</span>}
						value={s(() => statistics.busyUsers)}
					/>
					<TextSeparator
						label={<span><UserStatus status='away'/> {t('Away')}</span>}
						value={s(() => statistics.awayUsers)}
					/>
					<TextSeparator
						label={<span><UserStatus status='offline'/> {t('Offline')}</span>}
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
						label={<span><Icon name='dialpad' size='x16'/> {t('Stats_Total_Rooms')}</span>}
						value={s(() => statistics.totalRooms)}
					/>
					<TextSeparator
						label={<span><Icon name='hash' size='x16'/> {t('Stats_Total_Channels')}</span>}
						value={s(() => statistics.totalChannels)}
					/>
					<TextSeparator
						label={<span><Icon name='lock' size='x16'/> {t('Stats_Total_Private_Groups')}</span>}
						value={s(() => statistics.totalPrivateGroups)}
					/>
					<TextSeparator
						label={<span><Icon name='team' size='x16'/> {t('Stats_Total_Direct_Messages')}</span>}
						value={s(() => statistics.totalDirect)}
					/>
					<TextSeparator
						label={<span><Icon name='discussion' size='x16'/> {t('Total_Discussions')}</span>}
						value={s(() => statistics.totalDiscussions)}
					/>
					<TextSeparator
						label={<span><Icon name='headset' size='x16'/> {t('Stats_Total_Livechat_Rooms')}</span>}
						value={s(() => statistics.totalLivechat)}
					/>
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Messages')}</Card.Col.Title>
					<TextSeparator
						label={<span>{t('Stats_Total_Messages')}</span>}
						value={s(() => statistics.totalMessages)}
					/>
					<TextSeparator
						label={<span>{t('Total_Threads')}</span>}
						value={s(() => statistics.totalThreads)}
					/>
					<TextSeparator
						label={<span>{t('Stats_Total_Messages_Channel')}</span>}
						value={s(() => statistics.totalChannelMessages)}
					/>
					<TextSeparator
						label={<span>{t('Stats_Total_Messages_PrivateGroup')}</span>}
						value={s(() => statistics.totalPrivateGroupMessages)}
					/>
					<TextSeparator
						label={<span>{t('Stats_Total_Messages_Direct')}</span>}
						value={s(() => statistics.totalDirectMessages)}
					/>
					<TextSeparator
						label={<span>{t('Stats_Total_Messages_Livechat')}</span>}
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
