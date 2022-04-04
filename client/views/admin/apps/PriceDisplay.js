import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { formatPricingPlan, formatPrice } from './helpers';

const formatPriceAndPurchaseType = (purchaseType, pricingPlans, price) => {
	if (purchaseType === 'subscription') {
		const type = 'Subscription';
		if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
			return { type, price: '-' };
		}
		return { type, price: formatPricingPlan(pricingPlans[0]) };
	}

	if (price > 0) {
		return { type: 'Paid', price: formatPrice(price) };
	}

	return { type: 'Free', price: '-' };
};

function PriceDisplay({ purchaseType, pricingPlans, price, showType = true, ...props }) {
	const t = useTranslation();

	const { type, price: formattedPrice } = useMemo(
		() => formatPriceAndPurchaseType(purchaseType, pricingPlans, price),
		[purchaseType, pricingPlans, price],
	);
	return (
		<Box display='flex' flexDirection='column' {...props}>
			{showType && (
				<Box color='default' withTruncatedText>
					{t(type)}
				</Box>
			)}
			<Box color='hint' withTruncatedText>
				{!showType && type === 'Free' ? t(type) : formattedPrice}
			</Box>
		</Box>
	);
}

export default PriceDisplay;
