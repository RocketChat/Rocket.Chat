import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

export const RateLimiterClass = new (class {
	limitMethod(methodName, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return;
		}
		const match = {
			type: 'method',
			name: methodName,
		};
		Object.entries(matchers).forEach(([key, matcher]) => {
			match[key] = (...args) => matcher(...args);
		});
		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}
})();
