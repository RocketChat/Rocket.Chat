import { App } from '../types';

export type PricingPlan = App & {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
};
