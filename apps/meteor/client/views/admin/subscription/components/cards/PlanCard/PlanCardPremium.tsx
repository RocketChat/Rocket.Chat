import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Box, Card, CardBody, Icon, Skeleton } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';
import { useFormatDate } from '../../../../../../hooks/useFormatDate';
import { useIsSelfHosted } from '../../../../../../hooks/useIsSelfHosted';
import { useLicenseName } from '../../../../../../hooks/useLicense';
import { CONTACT_SALES_LINK } from '../../../utils/links';

type LicenseLimits = {
	activeUsers: { max: number; value?: number };
};

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
	licenseLimits: LicenseLimits;
};

const PlanCardPremium = ({ licenseInformation, licenseLimits }: PlanCardProps): ReactElement => {
	const { t } = useTranslation();
	const { isSelfHosted, isLoading } = useIsSelfHosted();
	const formatDate = useFormatDate();

	const planName = useLicenseName();

	const isAutoRenew = licenseInformation.autoRenew;
	const { visualExpiration } = licenseInformation;

	return (
		<Card height='full'>
			<PlanCardHeader name={planName.data ?? ''} />
			<CardBody flexDirection='column'>
				{licenseLimits?.activeUsers.max === Infinity && (
					<Box display='flex' alignItems='center'>
						<Icon name='lightning' size='x24' mie={12} />
						{t('Unlimited_seats')}
					</Box>
				)}
				{visualExpiration && (
					<Box display='flex' alignItems='center'>
						<Icon name='calendar' size='x24' mie={12} />
						<span>
							{isAutoRenew ? (
								t('Renews_DATE', { date: formatDate(visualExpiration || '') })
							) : (
								<Trans i18nKey='Contact_sales_renew_date'>
									<ExternalLink to={CONTACT_SALES_LINK}>Contact sales</ExternalLink> to check plan renew date.
								</Trans>
							)}
						</span>
					</Box>
				)}
				{!isLoading ? (
					<Box display='flex' alignItems='center'>
						<Icon name='cloud-plus' size='x24' mie={12} /> {isSelfHosted ? t('Self_managed_hosting') : t('Cloud_hosting')}
					</Box>
				) : (
					<Skeleton />
				)}
			</CardBody>
		</Card>
	);
};

export default PlanCardPremium;
