import type { PurchaseType, AppPricingPlan } from '@rocket.chat/core-typings';

import { formatPrice } from './formatPrice';
import { formatPricingPlan } from './formatPricingPlan';

type PlanType = 'Subscription' | 'Paid' | 'Free';

type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};

export const formatPriceAndPurchaseType = (
	purchaseType: PurchaseType,
	pricingPlans: AppPricingPlan[],
	price: number,
): FormattedPriceAndPlan => {
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
