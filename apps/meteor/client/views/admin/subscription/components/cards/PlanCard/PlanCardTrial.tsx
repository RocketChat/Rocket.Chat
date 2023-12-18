import type { ILicenseV3 } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import differenceInDays from 'date-fns/differenceInDays';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useLicenseName } from '../../../../../../hooks/useLicense';
import { DOWNGRADE_LINK, TRIAL_LINK } from '../../../utils/links';
import UpgradeButton from '../../UpgradeButton';
import PlanCardBase from './PlanCardBase';

type PlanCardProps = {
	licenseInformation: ILicenseV3['information'];
};

const PlanCardTrial = ({ licenseInformation }: PlanCardProps): ReactElement => {
	const { t } = useTranslation();

	const planName = useLicenseName();
	const isSalesAssisted = licenseInformation.grantedBy?.method !== 'self-service' || true;
	const { visualExpiration } = licenseInformation;

	return (
		<PlanCardBase name={planName.data ?? ''}>
			<Box display='flex' flexDirection='column' h='full'>
				{visualExpiration && (
					<Box fontScale='p2b' mb={6} display='flex'>
						<Box mie={8}>{t('Trial_active')}</Box>{' '}
						<Tag>{t('n_days_left', { n: differenceInDays(new Date(visualExpiration), new Date()) })}</Tag>
					</Box>
				)}
				<Box fontScale='p2' mb={6}>
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
				</Box>
				<Box fontScale='p2' mb={6}>
					<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
						<ExternalLink to={TRIAL_LINK}>Why has a trial been applied to this workspace?</ExternalLink>
					</Trans>
				</Box>

				<UpgradeButton target='plan_card_trial' action={isSalesAssisted ? 'finish_purchase' : 'contact_sales'} primary mbs='auto' w='full'>
					{isSalesAssisted ? t('Finish_purchase') : t('Contact_sales')}
				</UpgradeButton>
			</Box>
		</PlanCardBase>
	);
};

export default PlanCardTrial;
