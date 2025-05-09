import type { AppPricingPlan, PurchaseType } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatPriceAndPurchaseType } from '../../../helpers/formatPriceAndPurchaseType';

type AppStatusPriceDisplayProps = {
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
		<Margins inline={4}>
			<Tag>
				{showType && <Box color='default'>{i18n.exists(type) ? t(type) : type}</Box>}
				<Box>{!showType && type === 'Free' ? t(type) : formattedPrice}</Box>
			</Tag>
		</Margins>
	);
};

export default AppStatusPriceDisplay;
