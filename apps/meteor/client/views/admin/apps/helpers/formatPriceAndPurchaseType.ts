import type { AppPricingPlan } from '@rocket.chat/core-typings';

import type FormattedPriceAndPlan from '../utils/FormattedPriceAndPlan';
import { formatPrice } from './formatPrice';
import { formatPricingPlan } from './formatPricingPlan';

export const formatPriceAndPurchaseType = (purchaseType: string, pricingPlans: AppPricingPlan[], price: number): FormattedPriceAndPlan => {
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
