import { Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';
import UpgradeButton from '../UpgradeButton';
import UsagePieGraph from '../UsagePieGraph';

const MACCard = ({
	value = 0,
	max,
	hideManageSubscription,
}: {
	value: number;
	max: number;
	hideManageSubscription?: boolean;
}): ReactElement => {
	const { t } = useTranslation();

	const pieGraph = {
		used: value,
		total: max,
	};

	const nearLimit = pieGraph && pieGraph.used > 0 && pieGraph.used / pieGraph.total >= 0.8;

	const macLeft = pieGraph.total - pieGraph.used;

	const shouldShowBuyMore = !hideManageSubscription && nearLimit;
	const shouldShowUpgrade = hideManageSubscription && nearLimit;

	const card: CardProps = {
		title: t('Monthly_active_contacts'),
		infoText: t('MAC_InfoText'),
		...(shouldShowBuyMore && {
			upgradeButton: (
				<UpgradeButton target='mac-card' action='buy_more' small>
					{t('Buy_more')}
				</UpgradeButton>
			),

			...(shouldShowUpgrade && {
				upgradeButton: (
					<UpgradeButton target='mac-card' action='upgrade' small>
						{t('Upgrade')}
					</UpgradeButton>
				),
			}),
		}),
	};

	const color = nearLimit ? Palette.statusColor['status-font-on-danger'].toString() : undefined;

	const message = macLeft > 0 ? t('MAC_Available', { macLeft }) : undefined;

	return (
		<FeatureUsageCard card={card}>
			<FeatureUsageCardBody>
				<UsagePieGraph label={message} used={pieGraph.used} total={pieGraph.total} color={color} />
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};

export default MACCard;
