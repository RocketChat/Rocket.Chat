import type { AppPricingPlan, PurchaseType } from '@rocket.chat/core-typings';
import { Box, Margins, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { formatPriceAndPurchaseType } from '../../../helpers/formatPriceAndPurchaseType';

type AppStatusPriceDisplayProps = {
	purchaseType: PurchaseType;
	pricingPlans: AppPricingPlan[];
	price: number;
	showType?: boolean;
	marginInline?: string;
};

const AppStatusPriceDisplay: FC<AppStatusPriceDisplayProps> = ({ purchaseType, pricingPlans, price, showType = true }) => {
	const t = useTranslation();

	const { type, price: formattedPrice } = useMemo(
		() => formatPriceAndPurchaseType(purchaseType, pricingPlans, price),
		[purchaseType, pricingPlans, price],
	);

	return (
		<Margins inline={4}>
			<Tag>
				{showType && <Box color='default'>{t.has(type) ? t(type) : type}</Box>}
				<Box>{!showType && type === 'Free' ? t(type) : formattedPrice}</Box>
			</Tag>
		</Margins>
	);
};

export default AppStatusPriceDisplay;
