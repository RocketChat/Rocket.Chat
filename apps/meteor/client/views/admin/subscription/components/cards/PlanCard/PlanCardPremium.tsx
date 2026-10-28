import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Card, CardBody, Icon, Skeleton, Stack, Text } from '@rocket.chat/fuselage';
import { ExternalLink, useLicenseName } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';
import PlanCardLicenseDetails from './PlanCardLicenseDetails';
import { useFormatDate } from '../../../../../../hooks/useFormatDate';
import { useIsSelfHosted } from '../../../hooks/useIsSelfHosted';
import { CONTACT_SALES_LINK } from '../../../utils/links';

type LicenseLimits = {
	activeUsers: { max: number; value?: number };
};

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
	licenseLimits: LicenseLimits;
};

const PlanCardPremium = ({ licenseInformation, licenseLimits }: PlanCardProps) => {
	const { t } = useTranslation();
	const { isSelfHosted, isLoading } = useIsSelfHosted();
	const formatDate = useFormatDate();

	const planName = useLicenseName();

	const isAutoRenew = licenseInformation.autoRenew;
	const { visualExpiration } = licenseInformation;

	return (
		<Card>
			<PlanCardHeader name={planName.data ?? ''} />
			<CardBody flexDirection='column'>
				{licenseLimits?.activeUsers.max === Infinity && (
					<Stack direction='row' align='center' gap='x12'>
						<Icon name='lightning' size='x24' />
						{t('Unlimited_seats')}
					</Stack>
				)}
				{visualExpiration && (
					<Stack direction='row' align='center' gap='x12'>
						<Icon name='calendar' size='x24' />
						<Text is='span'>
							{isAutoRenew ? (
								t('Renews_DATE', { date: formatDate(visualExpiration || '') })
							) : (
								<Trans i18nKey='Contact_sales_renew_date'>
									<ExternalLink to={CONTACT_SALES_LINK}>Contact sales</ExternalLink> to check plan renew date.
								</Trans>
							)}
						</Text>
					</Stack>
				)}
				{!isLoading ? (
					<Stack direction='row' align='center' gap='x12'>
						<Icon name='cloud-plus' size='x24' /> {isSelfHosted ? t('Self_managed_hosting') : t('Cloud_hosting')}
					</Stack>
				) : (
					<Skeleton />
				)}
				<PlanCardLicenseDetails />
			</CardBody>
		</Card>
	);
};

export default PlanCardPremium;
