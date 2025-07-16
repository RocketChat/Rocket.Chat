import { Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';
import UpgradeButton from '../UpgradeButton';
import UsagePieGraph from '../UsagePieGraph';

type SeatsCardProps = {
	value: number;
	max: number;
	hideManageSubscription?: boolean;
};

const SeatsCard = ({ value, max, hideManageSubscription }: SeatsCardProps): ReactElement => {
	const { t } = useTranslation();

	const pieGraph = {
		used: value,
		total: max,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card: CardProps = {
		title: t('Seats'),
		infoText: t('Seats_InfoText'),
		...(!hideManageSubscription &&
			nearLimit && {
				upgradeButton: (
					<UpgradeButton target='seats-card' action='buy_more' small>
						{t('Buy_more')}
					</UpgradeButton>
				),
			}),
	};

	const seatsLeft = pieGraph.total - pieGraph.used;
	const color = pieGraph.used / pieGraph.total >= 0.8 ? Palette.statusColor['status-font-on-danger'].toString() : undefined;

	const message = seatsLeft > 0 ? t('Seats_Available', { seatsLeft }) : undefined;
	return (
		<FeatureUsageCard card={card}>
			<FeatureUsageCardBody>
				<UsagePieGraph label={message} used={pieGraph.used} total={pieGraph.total} color={color} />
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};

export default SeatsCard;
