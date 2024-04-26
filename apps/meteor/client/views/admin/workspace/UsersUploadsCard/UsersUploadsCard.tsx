import type { IStats } from '@rocket.chat/core-typings';
import { Button, Card, CardBody, CardControls } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import { useFormatMemorySize } from '../../../../hooks/useFormatMemorySize';
import WorkspaceCardSection from '../components/WorkspaceCardSection';
import WorkspaceCardTextSeparator from '../components/WorkspaceCardTextSeparator';

type UsersUploadsCardProps = {
	statistics: IStats;
};

const UsersUploadsCard = ({ statistics }: UsersUploadsCardProps): ReactElement => {
	const t = useTranslation();
	const formatMemorySize = useFormatMemorySize();

	const router = useRouter();

	const handleEngagement = useMutableCallback(() => {
		router.navigate('/admin/engagement');
	});

	const canViewEngagement = useHasLicenseModule('engagement-dashboard');

	return (
		<Card height='full'>
			<CardBody flexDirection='column'>
				<WorkspaceCardSection
					title={t('Users')}
					body={
						<>
							<WorkspaceCardTextSeparator label={t('Online')} status='online' value={statistics.onlineUsers} />
							<WorkspaceCardTextSeparator label={t('Busy')} status='busy' value={statistics.busyUsers} />
							<WorkspaceCardTextSeparator label={t('Away')} status='away' value={statistics.awayUsers} />
							<WorkspaceCardTextSeparator label={t('Offline')} status='offline' value={statistics.offlineUsers} />
							<WorkspaceCardTextSeparator label={t('Total')} value={statistics.totalUsers} />
						</>
					}
				/>

				<WorkspaceCardSection
					title={t('Types')}
					body={
						<>
							<WorkspaceCardTextSeparator label={t('Users_Connected')} value={statistics.totalConnectedUsers} />
							<WorkspaceCardTextSeparator label={t('Stats_Active_Users')} value={statistics.activeUsers} />
							<WorkspaceCardTextSeparator label={t('Stats_Active_Guests')} value={statistics.activeGuests} />
							<WorkspaceCardTextSeparator label={t('Stats_Non_Active_Users')} value={statistics.nonActiveUsers} />
							<WorkspaceCardTextSeparator label={t('Stats_App_Users')} value={statistics.appUsers} />
						</>
					}
				/>

				<WorkspaceCardSection
					title={t('Uploads')}
					body={
						<>
							<WorkspaceCardTextSeparator label={t('Stats_Total_Uploads')} value={statistics.uploadsTotal} />
							<WorkspaceCardTextSeparator label={t('Stats_Total_Uploads_Size')} value={formatMemorySize(statistics.uploadsTotalSize)} />
						</>
					}
				/>
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
