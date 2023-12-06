import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { CardCol, CardColSection, CardFooter, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { PRICING_LINK } from '../../utils/links';
import FeatureUsageCard from '../FeatureUsageCard';
import InfoTextIconModal from '../InfoTextIconModal';

type FeatureSet = {
	type: 'neutral' | 'success';
	title: string;
	infoText?: string;
};

type FeaturesCardProps = {
	activeModules: string[];
	isEnterprise: boolean;
};

const FeaturesCard = ({ activeModules, isEnterprise }: FeaturesCardProps): ReactElement => {
	const { t } = useTranslation();
	const isSmall = useMediaQuery('(min-width: 1180px)');

	const getFeatureSet = (modules: string[], isEnterprise: boolean): FeatureSet[] => {
		const featureSet: FeatureSet[] = [
			{
				type: isEnterprise ? 'success' : 'neutral',
				title: 'Premium_and_unlimited_apps',
			},
			{
				type: isEnterprise ? 'success' : 'neutral',
				title: 'Premium_omnichannel_capabilities',
			},
			{
				type: isEnterprise ? 'success' : 'neutral',
				title: 'Unlimited_push_notifications',
			},
			{
				type: modules.includes('videoconference-enterprise') ? 'success' : 'neutral',
				title: 'Video_call_manager',
			},
			{
				type: modules.includes('hide-watermark') ? 'success' : 'neutral',
				title: 'Remove_RocketChat_Watermark',
				infoText: 'Remove_RocketChat_Watermark_InfoText',
			},
			{
				type: modules.includes('scalability') ? 'success' : 'neutral',
				title: 'High_scalabaility',
			},
			{
				type: modules.includes('custom-roles') ? 'success' : 'neutral',
				title: 'Custom_roles',
			},
			{
				type: modules.includes('auditing') ? 'success' : 'neutral',
				title: 'Message_audit',
			},
		];

		const sortedFeatureSet = featureSet.sort((a, b) => {
			if (a.type === 'success' && b.type !== 'success') {
				return -1;
			}
			if (a.type !== 'success' && b.type === 'success') {
				return 1;
			}
			return featureSet.indexOf(a) - featureSet.indexOf(b);
		});

		return sortedFeatureSet;
	};

	return (
		<FeatureUsageCard card={{ title: !isEnterprise ? t('Unlock_premium_capabilities') : t('Includes') }}>
			<CardColSection h='full' w='full' display='flex' flexDirection='column'>
				<CardCol>
					<Box display='flex' flexWrap='wrap' justifyContent='space-between' flexDirection={isSmall ? 'row' : 'column'}>
						{getFeatureSet(activeModules, isEnterprise).map(({ type, title, infoText }, index) => (
							<Box key={`feature_${index}`} display='flex' alignItems='center' mbe={4} width={isSmall ? '50%' : 'full'}>
								<FramedIcon type={type} icon={type === 'success' ? 'check' : 'lock'} />
								<Box is='p' fontScale='p2' mis={12} mie={2} color='font-secondary-info'>
									{t(title)}
								</Box>
								{infoText && <InfoTextIconModal title={t(title)} infoText={t(infoText)} />}
							</Box>
						))}
					</Box>
				</CardCol>
				<CardFooter>
					<Box is='a' target='_blank' rel='noopener noreferrer' href={PRICING_LINK} textDecorationLine='underline'>
						{t('Compare_plans')}
					</Box>
				</CardFooter>
			</CardColSection>
		</FeatureUsageCard>
	);
};

export default FeaturesCard;
