import { Box, Card, CardBody, CardControls, CardTitle, FramedIcon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { PRICING_LINK } from '../../utils/links';
import InfoTextIconModal from '../InfoTextIconModal';

type FeatureSet = {
	success?: boolean;
	neutral?: boolean;
	title: string;
	infoText?: string;
};

type FeaturesCardProps = {
	activeModules: string[];
	isEnterprise: boolean;
};

const getFeatureSet = (modules: string[], isEnterprise: boolean): FeatureSet[] => {
	const featureSet: FeatureSet[] = [
		{
			success: isEnterprise,
			title: 'Premium_and_unlimited_apps',
		},
		{
			success: isEnterprise,
			title: 'Premium_omnichannel_capabilities',
		},
		{
			success: isEnterprise,
			title: 'Unlimited_push_notifications',
		},
		{
			success: modules.includes('videoconference-enterprise'),
			title: 'Video_call_manager',
		},
		{
			success: modules.includes('hide-watermark'),
			title: 'Remove_RocketChat_Watermark',
			infoText: 'Remove_RocketChat_Watermark_InfoText',
		},
		{
			success: modules.includes('scalability'),
			title: 'High_scalabaility',
		},
		{
			success: modules.includes('custom-roles'),
			title: 'Custom_roles',
		},
		{
			success: modules.includes('auditing'),
			title: 'Message_audit',
		},
	];

	// eslint-disable-next-line no-nested-ternary
	return featureSet.sort(({ success: a }, { success: b }) => (a === b ? 0 : a ? -1 : 1));
};

const FeaturesCard = ({ activeModules, isEnterprise }: FeaturesCardProps): ReactElement => {
	const { t } = useTranslation();
	const isSmall = useMediaQuery('(min-width: 1180px)');

	return (
		<Card>
			<CardTitle>{!isEnterprise ? t('Unlock_premium_capabilities') : t('Includes')}</CardTitle>
			<CardBody>
				<Box display='flex' flexWrap='wrap' justifyContent='space-between' flexDirection={isSmall ? 'row' : 'column'}>
					{getFeatureSet(activeModules, isEnterprise).map(({ success, title, infoText }, index) => (
						<Box key={`feature_${index}`} display='flex' alignItems='center' mbe={4} width={isSmall ? '50%' : 'full'}>
							<FramedIcon success={success} icon={success ? 'check' : 'lock'} />
							<Box is='p' fontScale='p2' mis={12} mie={2} color='font-secondary-info'>
								{t(title)}
							</Box>
							{infoText && <InfoTextIconModal title={t(title)} infoText={t(infoText)} />}
						</Box>
					))}
				</Box>
			</CardBody>
			<CardControls>
				<a target='_blank' rel='noopener noreferrer' href={PRICING_LINK}>
					{t('Compare_plans')}
				</a>
			</CardControls>
		</Card>
	);
};

export default FeaturesCard;
