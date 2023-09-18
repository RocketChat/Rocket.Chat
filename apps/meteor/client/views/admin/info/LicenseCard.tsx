import { ButtonGroup, Button, Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Card, CardBody, CardCol, CardTitle, CardColSection, CardColTitle, CardFooter } from '@rocket.chat/ui-client';
import { useSetModal, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import PlanTag from '../../../components/PlanTag';
import { useLicense } from '../../../hooks/useLicense';
import Feature from './Feature';
import OfflineLicenseModal from './OfflineLicenseModal';

const LicenseCard = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const currentLicense = useSetting('Enterprise_License') as string;
	const licenseStatus = useSetting('Enterprise_License_Status') as string;

	const isAirGapped = true;

	const { data, isError, isLoading } = useLicense();

	const { modules = [] } = isLoading || isError || !data?.licenses?.length ? {} : data?.licenses[0];

	const hasEngagement = modules.includes('engagement-dashboard');
	const hasOmnichannel = modules.includes('livechat-enterprise');
	const hasAuditing = modules.includes('auditing');
	const hasCannedResponses = modules.includes('canned-responses');
	const hasReadReceipts = modules.includes('message-read-receipt');

	const handleApplyLicense = useMutableCallback(() =>
		setModal(
			<OfflineLicenseModal
				onClose={(): void => {
					setModal();
				}}
				license={currentLicense}
				licenseStatus={licenseStatus}
			/>,
		),
	);

	return (
		<Card data-qa-id='license-card'>
			<CardTitle>{t('License')}</CardTitle>
			<CardBody>
				<CardCol>
					<CardColSection>
						<PlanTag />
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Features')}</CardColTitle>
						{isLoading ? (
							<>
								<Skeleton width='40x' />
								<Skeleton width='40x' />
								<Skeleton width='40x' />
								<Skeleton width='40x' />
							</>
						) : (
							<>
								<Feature label={t('Omnichannel')} enabled={hasOmnichannel} />
								<Feature label={t('Auditing')} enabled={hasAuditing} />
								<Feature label={t('Canned_Responses')} enabled={hasCannedResponses} />
								<Feature label={t('Engagement_Dashboard')} enabled={hasEngagement} />
								<Feature label={t('Read_Receipts')} enabled={hasReadReceipts} />
							</>
						)}
					</CardColSection>
				</CardCol>
			</CardBody>
			<CardFooter>
				<ButtonGroup>
					{isAirGapped ? (
						<Button small onClick={handleApplyLicense}>
							{t(currentLicense ? 'Cloud_Change_Offline_License' : 'Cloud_Apply_Offline_License')}
						</Button>
					) : (
						<Button small>{t('Cloud_connectivity')}</Button>
					)}
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
};

export default LicenseCard;
