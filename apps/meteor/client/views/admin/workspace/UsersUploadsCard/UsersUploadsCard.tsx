import type { IStats } from '@rocket.chat/core-typings';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { TextSeparator, Card, CardBody, CardCol, CardColSection, CardColTitle, CardFooter, CardIcon } from '@rocket.chat/ui-client';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import { UserStatus } from '../../../../components/UserStatus';
import { useFormatMemorySize } from '../../../../hooks/useFormatMemorySize';

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
		<Card>
			<CardBody>
				<CardCol>
					<CardColSection mbs={0} mbe={16}>
						<CardColTitle>{t('Users')}</CardColTitle>
						<TextSeparator
							label={
								<>
									<CardIcon>
										<UserStatus status='online' />
									</CardIcon>
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
									</CardIcon>
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
									</CardIcon>
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
									</CardIcon>
									{t('Offline')}
								</>
							}
							value={statistics.offlineUsers}
						/>
						<TextSeparator label={t('Total')} value={statistics.totalUsers} />
					</CardColSection>

					<CardColSection mb={16}>
						<CardColTitle>{t('Types')}</CardColTitle>
						<TextSeparator label={t('Users_Connected')} value={statistics.totalConnectedUsers} />
						<TextSeparator label={t('Stats_Active_Users')} value={statistics.activeUsers} />
						<TextSeparator label={t('Stats_Active_Guests')} value={statistics.activeGuests} />
						<TextSeparator label={t('Stats_Non_Active_Users')} value={statistics.nonActiveUsers} />
						<TextSeparator label={t('Stats_App_Users')} value={statistics.appUsers} />
					</CardColSection>

					<CardColSection mb={16}>
						<CardColTitle>{t('Uploads')}</CardColTitle>
						<TextSeparator label={t('Stats_Total_Uploads')} value={statistics.uploadsTotal} />
						<TextSeparator label={t('Stats_Total_Uploads_Size')} value={formatMemorySize(statistics.uploadsTotalSize)} />
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

export default memo(UsersUploadsCard);
