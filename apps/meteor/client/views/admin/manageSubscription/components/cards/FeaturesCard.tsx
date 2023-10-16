import { Box } from '@rocket.chat/fuselage';
import { CardCol, CardColSection, CardFooter, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PlanName } from '../../../../../lib/utils/getPlanName';
import { PRICING_LINK } from '../../utils/links';
import type { FeatureSet } from '../../utils/planFeatures';
import { planFeatures } from '../../utils/planFeatures';
import FeatureUsageCard from '../FeatureUsageCard';
import InfoTextIconModal from '../InfoTextIconModal';

type FeaturesCardProps = {
	plan: PlanName;
};

const FeaturesCard = ({ plan }: FeaturesCardProps): ReactElement => {
	const { t } = useTranslation();

	const CE_FEATURES = [...planFeatures.community];
	const STARTER_FEATURES = [...planFeatures.starter];
	const ENTERPRISE_FEATURES = [...planFeatures.enterprise];
	const PRO_FEATURES = [...planFeatures.pro];

	const getLicenseFeatures = (): FeatureSet[] => {
		if (plan === PlanName.COMMUNITY) {
			return CE_FEATURES;
		}

		if (plan === PlanName.ENTERPRISE) {
			return ENTERPRISE_FEATURES;
		}

		if (plan === PlanName.PRO) {
			PRO_FEATURES.push({ type: 'success', title: 'Remove_RocketChat_Watermark' });
			return PRO_FEATURES;
		}

		if (plan === PlanName.PRO_TRIAL) {
			PRO_FEATURES.push({ type: 'neutral', title: 'Remove_RocketChat_Watermark', infoText: 'Remove_RocketChat_Watermark_InfoText' });
			return PRO_FEATURES;
		}

		return STARTER_FEATURES;
	};

	const features = getLicenseFeatures();

	return (
		<FeatureUsageCard card={{ title: t('Includes') }}>
			<CardColSection h='full' w='full' display='flex' flexDirection='column'>
				<CardCol>
					<Box maxHeight={120} display='flex' flexDirection='column' flexWrap='wrap'>
						{features.map(({ type, title, infoText }, index) => (
							<Box key={`feature_${index}`} display='flex' alignItems='center' mbe={4}>
								<FramedIcon type={type} icon={type === 'success' ? 'check' : 'lock'} />
								<Box is='p' fontScale='p2' mis={12} color='font-secondary-info'>
									{t(title)}
								</Box>
								{infoText && <InfoTextIconModal title={t(title)} infoText={t(infoText)} />}
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
