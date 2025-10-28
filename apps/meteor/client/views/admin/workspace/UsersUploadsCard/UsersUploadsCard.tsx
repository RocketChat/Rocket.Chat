import type { IStats } from '@rocket.chat/core-typings';
import { Button, Card, CardBody, CardControls, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatMemorySize } from '../../../../hooks/useFormatMemorySize';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import WorkspaceCardSection from '../components/WorkspaceCardSection';
import WorkspaceCardSectionTitle from '../components/WorkspaceCardSectionTitle';
import WorkspaceCardTextSeparator from '../components/WorkspaceCardTextSeparator';

type UsersUploadsCardProps = {
	statistics: IStats;
};

const UsersUploadsCard = ({ statistics }: UsersUploadsCardProps): ReactElement => {
	const { t } = useTranslation();
	const formatMemorySize = useFormatMemorySize();

	const router = useRouter();

	const handleEngagement = useEffectEvent(() => {
		router.navigate('/admin/engagement');
	});

	const canViewEngagement = useHasLicenseModule('engagement-dashboard');

	return (
		<Card height='full'>
			<CardBody flexDirection='column'>
				<Margins blockEnd={24}>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Users')} variant='h4' />

						<WorkspaceCardTextSeparator label={t('Online')} status='online' value={statistics.onlineUsers} />
						<WorkspaceCardTextSeparator label={t('Busy')} status='busy' value={statistics.busyUsers} />
						<WorkspaceCardTextSeparator label={t('Away')} status='away' value={statistics.awayUsers} />
						<WorkspaceCardTextSeparator label={t('Offline')} status='offline' value={statistics.offlineUsers} />
						<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalUsers} />
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Types')} variant='h4' />

						<WorkspaceCardTextSeparator label={t('Users_Connected')} value={statistics.totalConnectedUsers} />
						<WorkspaceCardTextSeparator label={t('Stats_Active_Users')} value={statistics.activeUsers} />
						<WorkspaceCardTextSeparator label={t('Stats_Active_Guests')} value={statistics.activeGuests} />
						<WorkspaceCardTextSeparator label={t('Stats_Non_Active_Users')} value={statistics.nonActiveUsers} />
						<WorkspaceCardTextSeparator label={t('Stats_App_Users')} value={statistics.appUsers} />
					</WorkspaceCardSection>

					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Uploads')} variant='h4' />

						<WorkspaceCardTextSeparator label={t('Stats_Total_Uploads')} value={statistics.uploadsTotal} />
						<WorkspaceCardTextSeparator label={t('Stats_Total_Uploads_Size')} value={formatMemorySize(statistics.uploadsTotalSize)} />
					</WorkspaceCardSection>
				</Margins>
			</CardBody>

			<CardControls>
				<Button disabled={!canViewEngagement} medium onClick={handleEngagement}>
					{t('See_on_Engagement_Dashboard')}
				</Button>
			</CardControls>
		</Card>
	);
};

export default memo(UsersUploadsCard);
