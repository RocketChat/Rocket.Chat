declare module 'meteor/rate-limit' {
	type RateLimiterOptionsToCheck = {
		IPAddr: string;
		route: string;
		userId?: string;
	};

	type RateLimiterMatcher = (input: string) => unknown;

	type RateLimiterRule = {
		route: string;
	} & ({ IPAddr: RateLimiterMatcher } | { userId: RateLimiterMatcher });

	type RateLimiterCheckResult = {
		allowed: boolean;
		timeToReset: number;
		numInvocationsLeft: number;
	};

	class RateLimiter {
		public check(input: RateLimiterOptionsToCheck): Promise<RateLimiterCheckResult>;

		public increment(input: RateLimiterOptionsToCheck);

		public addRule(rule: RateLimiterRule, numRequestsAllowed: number, intervalTime: number, callback?: () => void): void;
	}
}
