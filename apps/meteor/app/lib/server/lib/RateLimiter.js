import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from '@rocket.chat/ddp-rate-limit';
import { RateLimiter } from '@rocket.chat/rate-limit';

export const RateLimiterClass = new (class {
	limitFunction(fn, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return fn;
		}
		const rateLimiter = new RateLimiter();

		rateLimiter.addRule(matchers, numRequests, timeInterval);
		return async function (...args) {
			const match = {};

			Object.keys(matchers).forEach(function (key) {
				match[key] = args[key];
			});

			await rateLimiter.increment(match);
			const session = Meteor.server.sessions.get(match.connectionId);
			const rateLimitResult = await rateLimiter.check(match, session);
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

		Object.entries(matchers).forEach(function ([key, matcher]) {
			match[key] = matcher;
		});

		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}
})();
