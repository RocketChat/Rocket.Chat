import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Card, CardBody, CardControls, CardRow, Stack, Tag, Text } from '@rocket.chat/fuselage';
import { ExternalLink, useLicenseName } from '@rocket.chat/ui-client';
import { differenceInDays } from 'date-fns/differenceInDays';
import { Trans, useTranslation } from 'react-i18next';

import PlanCardHeader from './PlanCardHeader';
import PlanCardLicenseDetails from './PlanCardLicenseDetails';
import PlanCardCallToAction from '../../../layout/PlanCardCallToAction';
import { DOWNGRADE_LINK, TRIAL_LINK } from '../../../utils/links';
import UpgradeButton from '../../UpgradeButton';

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
};

const PlanCardTrial = ({ licenseInformation }: PlanCardProps) => {
	const { t } = useTranslation();

	const planName = useLicenseName();
	const isSalesAssisted = licenseInformation.grantedBy?.method !== 'self-service' || true;
	const { visualExpiration } = licenseInformation;

	return (
		<Card>
			<PlanCardHeader name={planName.data ?? ''} />
			<CardBody flexDirection='column'>
				{visualExpiration && (
					<CardRow>
						<Stack direction='row' align='center' gap='x16'>
							<Text fontScale='p2b'>{t('Trial_active')}</Text>
							<Tag>{t('n_days_left', { n: differenceInDays(new Date(visualExpiration), new Date()) })}</Tag>
						</Stack>
					</CardRow>
				)}
				<CardRow>
					<Text is='span'>
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
					</Text>
				</CardRow>
				<CardRow>
					<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
						<ExternalLink to={TRIAL_LINK}>Why has a trial been applied to this workspace?</ExternalLink>
					</Trans>
				</CardRow>
				<PlanCardLicenseDetails />
			</CardBody>
			<CardControls>
				<PlanCardCallToAction>
					<UpgradeButton target='plan_card_trial' action={isSalesAssisted ? 'finish_purchase' : 'contact_sales'} variant='primary'>
						{isSalesAssisted ? t('Finish_purchase') : t('Contact_sales')}
					</UpgradeButton>
				</PlanCardCallToAction>
			</CardControls>
		</Card>
	);
};

export default PlanCardTrial;
