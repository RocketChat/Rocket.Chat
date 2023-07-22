import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { RateLimiter } from 'meteor/rate-limit';

export const RateLimiterClass = new (class {
	limitFunction(fn, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return fn;
		}
		const rateLimiter = new RateLimiter();
		Object.entries(matchers).forEach(([key, matcher]) => {
			matchers[key] = (...args) => Promise.await(matcher(...args));
		});

		rateLimiter.addRule(matchers, numRequests, timeInterval);
		return function (...args) {
			const match = {};

			Object.keys(matchers).forEach((key) => {
				match[key] = args[key];
			});

			rateLimiter.increment(match);
			const rateLimitResult = rateLimiter.check(match);
			if (rateLimitResult.allowed) {
				return fn.apply(null, args);
			}
			throw new Meteor.Error(
				'error-too-many-requests',
				`Error, too many requests. Please slow down. You must wait ${Math.ceil(
					rateLimitResult.timeToReset / 1000,
				)} seconds before trying again.`,
				{
					timeToReset: rateLimitResult.timeToReset,
					seconds: Math.ceil(rateLimitResult.timeToReset / 1000),
				},
			);
		};
	}

	limitMethod(methodName, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return;
		}
		const match = {
			type: 'method',
			name: methodName,
		};
		Object.entries(matchers).forEach(([key, matcher]) => {
			match[key] = (...args) => Promise.await(matcher(...args));
		});
		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}
})();
