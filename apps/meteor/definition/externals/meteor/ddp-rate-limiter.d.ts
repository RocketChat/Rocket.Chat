declare module 'meteor/ddp-rate-limiter' {
	namespace DDPRateLimiter {
		function _increment(number: DDPRateLimiter.Matcher): void;
		function _check(number: DDPRateLimiter.Matcher): {
			allowed: boolean;
			timeToReset: number;
		};
		function getErrorMessage(result: { allowed: boolean }): string;
	}
}
