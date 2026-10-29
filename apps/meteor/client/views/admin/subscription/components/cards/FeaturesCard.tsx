import { Card, CardBody, CardControls, CardTitle, FramedIcon, Text } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import FeatureList from '../../layout/FeatureList';
import FeatureListItem from '../../layout/FeatureListItem';
import { PRICING_LINK } from '../../utils/links';
import InfoTextIconModal from '../InfoTextIconModal';

type FeatureSet = {
	success?: boolean;
	neutral?: boolean;
	title: string;
	infoText?: string;
};

export type FeaturesCardProps = {
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
			title: 'High_scalability',
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

	// oxlint-disable-next-line no-nested-ternary
	return featureSet.sort(({ success: a }, { success: b }) => (a === b ? 0 : a ? -1 : 1));
};

const FeaturesCard = ({ activeModules, isEnterprise }: FeaturesCardProps) => {
	const { t } = useTranslation();
	const isSmall = useMediaQuery('(min-width: 1180px)');

	return (
		<Card>
			<CardTitle>{!isEnterprise ? t('Unlock_premium_capabilities') : t('Includes')}</CardTitle>
			<CardBody>
				<FeatureList twoColumns={isSmall}>
					{getFeatureSet(activeModules, isEnterprise).map(({ success, title, infoText }, index) => (
						<FeatureListItem
							key={`feature_${index}`}
							twoColumns={isSmall}
							icon={<FramedIcon success={success} icon={success ? 'check' : 'lock'} />}
							action={infoText && <InfoTextIconModal title={t(title)} infoText={t(infoText)} />}
						>
							<Text is='p' fontScale='p2' color='secondary-info'>
								{t(title)}
							</Text>
						</FeatureListItem>
					))}
				</FeatureList>
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
