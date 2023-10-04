import { Box } from '@rocket.chat/fuselage';
import { CardCol, CardColSection, CardFooter, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PlanName } from '../../../../../lib/utils/getPlanName';
import { PRICING_LINK } from '../../utils/links';
import FeatureUsageCard from '../FeatureUsageCard';
import InfoTextIconModal from '../InfoTextIconModal';

type FeatureSet = {
	type: 'neutral' | 'success';
	title: string;
	infoText?: string;
};

type FeaturesCardProps = {
	plan: PlanName;
};

const FeaturesCard = ({ plan }: FeaturesCardProps): ReactElement => {
	const { t } = useTranslation();

	const CE_FEATURES: FeatureSet[] = [
		{
			type: 'success',
			title: t('Unlimited_seats_and_MACs'),
		},
		{
			type: 'neutral',
			title: t('Unlimited_push_notifications'),
		},
		{
			type: 'neutral',
			title: t('Premium_and_unlimited_apps'),
		},
		{
			type: 'neutral',
			title: t('Premium_omnichannel_capabilities'),
		},
		{
			type: 'neutral',
			title: t('White_label_branding'),
		},
		{
			type: 'neutral',
			title: t('Video_call_manager'),
		},
	];
	const ENTERPRISE_FEATURES: FeatureSet[] = [
		{
			type: 'success',
			title: t('High_scalabaility'),
		},
		{
			type: 'success',
			title: t('Custom_roles'),
		},
		{
			type: 'success',
			title: t('Premium_and_unlimited_apps'),
		},
		{
			type: 'success',
			title: t('Analytics'),
		},
		{
			type: 'success',
			title: t('Message_audit'),
		},
		{
			type: 'success',
			title: t('Advanced_authentication_services'),
		},
	];

	const PRO_FEATURES: FeatureSet[] = [
		{
			type: 'success',
			title: t('Premium_and_unlimited_apps'),
		},
		{
			type: 'success',
			title: t('Premium_omnichannel_capabilities'),
		},
		{
			type: 'success',
			title: t('Video_call_manager'),
		},
		{
			type: 'success',
			title: t('Unlimited_push_notifications'),
		},
		{
			type: 'neutral',
			title: t('High_scalabaility'),
		},
	];

	const STARTER_FEATURES: FeatureSet[] = [
		{
			type: 'success',
			title: t('Premium_and_unlimited_apps'),
		},
		{
			type: 'success',
			title: t('Premium_omnichannel_capabilities'),
		},
		{
			type: 'success',
			title: t('Unlimited_push_notifications'),
		},
		{
			type: 'neutral',
			title: t('White_label_branding'),
		},
		{
			type: 'neutral',
			title: t('Up_to_N_seats'),
		},
		{
			type: 'neutral',
			title: t('Up_to_N_MACs'),
		},
	];

	const getLicenseFeatures = (): FeatureSet[] => {
		if (plan === PlanName.COMMUNITY) {
			return CE_FEATURES;
		}

		if (plan === PlanName.ENTERPRISE) {
			return ENTERPRISE_FEATURES;
		}

		if (plan === PlanName.PRO) {
			PRO_FEATURES.push({ type: 'success', title: t('White_label_branding') });
			return PRO_FEATURES;
		}

		if (plan === PlanName.PRO_TRIAL) {
			PRO_FEATURES.push({ type: 'neutral', title: t('White_label_branding'), infoText: t('WhiteLabel_trial_InfoText') });
			return PRO_FEATURES;
		}

		return STARTER_FEATURES;
	};

	const features = getLicenseFeatures();

	return (
		<FeatureUsageCard title='Includes'>
			<CardColSection h='full' w='full' display='flex' flexDirection='column'>
				<CardCol>
					<Box maxHeight={120} display='flex' flexDirection='column' flexWrap='wrap'>
						{features.map(({ type, title, infoText }, index) => (
							<Box key={`feature_${index}`} display='flex' alignItems='center' mbe={4}>
								<FramedIcon type={type} icon={type === 'success' ? 'check' : 'lock'} />
								<Box is='p' fontScale='p2' mis={12} color='font-secondary-info'>
									{title}
								</Box>
								{infoText && <InfoTextIconModal title={title} infoText={infoText} />}
							</Box>
						))}
					</Box>
				</CardCol>
				<CardFooter>
					<Trans i18nKey='Compare_plans'>
						<Box is='a' target='_blank' rel='noopener noreferrer' href={PRICING_LINK} textDecorationLine='underline'>
							Compare plans
						</Box>
					</Trans>
				</CardFooter>
			</CardColSection>
		</FeatureUsageCard>
	);
};

export default FeaturesCard;
