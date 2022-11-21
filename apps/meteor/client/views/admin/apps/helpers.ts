type PlanType = 'Subscription' | 'Paid' | 'Free';

export type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};
