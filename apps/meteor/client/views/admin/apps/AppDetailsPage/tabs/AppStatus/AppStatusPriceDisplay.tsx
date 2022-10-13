import type { AppPricingPlan } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import { formatPriceAndPurchaseType } from '../../../helpers';

type AppStatusPriceDisplayProps = {
	purchaseType: string;
	pricingPlans: AppPricingPlan[];
	price: number;
	showType?: boolean;
	marginInline?: string;
};

const AppStatusPriceDisplay: FC<AppStatusPriceDisplayProps> = ({ purchaseType, pricingPlans, price, showType = true, ...props }) => {
	const t = useTranslation();

	const { type, price: formattedPrice } = useMemo(
		() => formatPriceAndPurchaseType(purchaseType, pricingPlans, price),
		[purchaseType, pricingPlans, price],
	);

	return (
		<Box display='flex' flexDirection='column' {...props}>
			{showType && (
				<Box color='default' withTruncatedText>
					{t(type as TranslationKey)}
				</Box>
			)}
			<Box withTruncatedText>{!showType && type === 'Free' ? t(type) : formattedPrice}</Box>
		</Box>
	);
};

export default AppStatusPriceDisplay;
