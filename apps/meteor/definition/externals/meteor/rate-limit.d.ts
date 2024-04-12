declare module 'meteor/rate-limit' {
	type RateLimiterOptionsToCheck = {
		IPAddr: string;
		route: string;
	};

	type RateLimiterCheckResult = {
		allowed: boolean;
		timeToReset: number;
		numInvocationsLeft: number;
	};

	class RateLimiter {
		public check(input: RateLimiterOptionsToCheck): Promise<RateLimiterCheckResult>;

		public increment(input: RateLimiterOptionsToCheck);

		public addRule(
			rule: { IPAddr: (input: any) => any; route: string },
			numRequestsAllowed: number,
			intervalTime: number,
			callback?: () => void,
		): void;
	}
}
