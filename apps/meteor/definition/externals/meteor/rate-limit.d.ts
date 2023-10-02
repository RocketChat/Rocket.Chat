declare module 'meteor/rate-limit' {
	type RateLimiterOptionsToCheck = {
		IPAddr: string;
		route: string;
	};

	class RateLimiter {
		public check(input: RateLimiterOptionsToCheck);

		public increment(input: RateLimiterOptionsToCheck);

		public addRule(
			rule: { IPAddr: (input: any) => any; route: string },
			numRequestsAllowed: number,
			intervalTime: number,
			callback?: () => void,
		): void;
	}
}
