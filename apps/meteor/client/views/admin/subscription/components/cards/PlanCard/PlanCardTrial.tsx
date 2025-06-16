import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Box, Card, CardBody, CardControls, CardRow, Tag } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import differenceInDays from 'date-fns/differenceInDays';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';
import { useLicenseName } from '../../../../../../hooks/useLicense';
import { DOWNGRADE_LINK, TRIAL_LINK } from '../../../utils/links';
import UpgradeButton from '../../UpgradeButton';

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
};

const PlanCardTrial = ({ licenseInformation }: PlanCardProps): ReactElement => {
	const { t } = useTranslation();

	const planName = useLicenseName();
	const isSalesAssisted = licenseInformation.grantedBy?.method !== 'self-service' || true;
	const { visualExpiration } = licenseInformation;

	return (
		<Card height='full'>
			<PlanCardHeader name={planName.data ?? ''} />
			<CardBody flexDirection='column'>
				{visualExpiration && (
					<CardRow>
						<Box fontScale='p2b' mie={8}>
							{t('Trial_active')}
						</Box>
						<Tag>{t('n_days_left', { n: differenceInDays(new Date(visualExpiration), new Date()) })}</Tag>
					</CardRow>
				)}

				<CardRow>
					<span>
						{isSalesAssisted ? (
							<Trans i18nKey='Contact_sales_trial'>
								Contact sales to finish your purchase and avoid
								<ExternalLink to={DOWNGRADE_LINK}>downgrade consequences.</ExternalLink>
							</Trans>
						) : (
							<Trans i18nKey='Finish_your_purchase_trial'>
								Finish your purchase to avoid <ExternalLink to={DOWNGRADE_LINK}>downgrade consequences.</ExternalLink>
							</Trans>
						)}
					</span>
				</CardRow>

				<CardRow>
					<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
						<ExternalLink to={TRIAL_LINK}>Why has a trial been applied to this workspace?</ExternalLink>
					</Trans>
				</CardRow>
			</CardBody>

			<CardControls>
				<UpgradeButton target='plan_card_trial' action={isSalesAssisted ? 'finish_purchase' : 'contact_sales'} primary mbs='auto' w='full'>
					{isSalesAssisted ? t('Finish_purchase') : t('Contact_sales')}
				</UpgradeButton>
			</CardControls>
		</Card>
	);
};

export default PlanCardTrial;
