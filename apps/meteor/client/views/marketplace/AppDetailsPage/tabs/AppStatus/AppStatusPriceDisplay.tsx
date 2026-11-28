import type { AppPricingPlan, PurchaseType } from '@rocket.chat/core-typings';
import { Tag, Text } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatPriceAndPurchaseType } from '../../../helpers/formatPriceAndPurchaseType';

export type AppStatusPriceDisplayProps = {
	purchaseType: PurchaseType;
	pricingPlans: AppPricingPlan[];
	price: number;
	showType?: boolean;
	marginInline?: string;
};

const AppStatusPriceDisplay = ({ purchaseType, pricingPlans, price, showType = true }: AppStatusPriceDisplayProps) => {
	const { t, i18n } = useTranslation();

	const { type, price: formattedPrice } = useMemo(
		() => formatPriceAndPurchaseType(purchaseType, pricingPlans, price),
		[purchaseType, pricingPlans, price],
	);

	return (
		<Tag>
			{showType && <Text color='default'>{i18n.exists(type) ? t(type) : type}</Text>}
			<Text>{!showType && type === 'Free' ? t(type) : formattedPrice}</Text>
		</Tag>
	);
};

export default AppStatusPriceDisplay;
