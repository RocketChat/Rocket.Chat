type PlanType = 'Subscription' | 'Paid' | 'Free';

type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};

export default FormattedPriceAndPlan;
