export type PricingPlan = {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
	tiers?: Tiers[];
};

export type Tiers = {
	perUnit: boolean;
	minimum: number;
	maximum: number;
	price: number;
};
