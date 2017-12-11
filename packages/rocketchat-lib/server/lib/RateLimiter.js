/* globals RateLimiter */
import _ from 'underscore';

RocketChat.RateLimiter = new class {
	limitFunction(fn, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return fn;
		}
		const rateLimiter = new RateLimiter();
		rateLimiter.addRule(matchers, numRequests, timeInterval);
		return function(...args) {
			const match = {};
			_.each(matchers, function(matcher, key) {
				return match[key] = args[key];
			});
			rateLimiter.increment(match);
			const rateLimitResult = rateLimiter.check(match);
			if (rateLimitResult.allowed) {
				return fn.apply(null, arguments);
			} else {
				throw new Meteor.Error('error-too-many-requests', `Error, too many requests. Please slow down. You must wait ${ Math.ceil(rateLimitResult.timeToReset / 1000) } seconds before trying again.`, {
					timeToReset: rateLimitResult.timeToReset,
					seconds: Math.ceil(rateLimitResult.timeToReset / 1000)
				});
			}
		};
	}

	limitMethod(methodName, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return;
		}
		const match = {
			type: 'method',
			name: methodName
		};
		_.each(matchers, function(matcher, key) {
			return match[key] = matchers[key];
		});
		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}

};
