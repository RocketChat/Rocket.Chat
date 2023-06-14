import type { AppPricingPlan } from '@rocket.chat/core-typings';

import { t } from '../../../../app/utils/lib/i18n';
import { formatPrice } from './formatPrice';

export const formatPricingPlan = ({ strategy, price, tiers = [], trialDays }: AppPricingPlan): string => {
	const { perUnit = false } = (Array.isArray(tiers) && tiers.find((tier) => tier.price === price)) || {};

	const pricingPlanTranslationString = [
		'Apps_Marketplace_pricingPlan',
		Array.isArray(tiers) && tiers.length > 0 && '+*',
		strategy,
		trialDays && 'trialDays',
		perUnit && 'perUser',
	]
		.filter(Boolean)
		.join('_');

	return t(pricingPlanTranslationString, {
		price: formatPrice(price),
		trialDays,
	});
};
