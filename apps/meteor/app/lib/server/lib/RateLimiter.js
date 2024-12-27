import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { RateLimiter } from 'meteor/rate-limit';

export const RateLimiterClass = new (class {
	limitFunction(fn, numRequests, timeInterval, matchers) {
		if (process.env.TEST_MODE === 'true') {
			return fn;
		}
		const rateLimiter = new (class extends RateLimiter {
			async check(input) {
				const reply = {
					allowed: true,
					timeToReset: 0,
					numInvocationsLeft: Infinity,
				};

				const matchedRules = this._findAllMatchingRules(input);

				for await (const rule of matchedRules) {
					const ruleResult = await rule.apply(input);
					let numInvocations = rule.counters[ruleResult.key];

					if (ruleResult.timeToNextReset < 0) {
						// Reset all the counters since the rule has reset
						await rule.resetCounter();
						ruleResult.timeSinceLastReset = new Date().getTime() - rule._lastResetTime;
						ruleResult.timeToNextReset = rule.options.intervalTime;
						numInvocations = 0;
					}

					if (numInvocations > rule.options.numRequestsAllowed) {
						// Only update timeToReset if the new time would be longer than the
						// previously set time. This is to ensure that if this input triggers
						// multiple rules, we return the longest period of time until they can
						// successfully make another call
						if (reply.timeToReset < ruleResult.timeToNextReset) {
							reply.timeToReset = ruleResult.timeToNextReset;
						}
						reply.allowed = false;
						reply.numInvocationsLeft = 0;
						reply.ruleId = rule.id;
						await rule._executeCallback(reply, input);
					} else {
						// If this is an allowed attempt and we haven't failed on any of the
						// other rules that match, update the reply field.
						if (rule.options.numRequestsAllowed - numInvocations < reply.numInvocationsLeft && reply.allowed) {
							reply.timeToReset = ruleResult.timeToNextReset;
							reply.numInvocationsLeft = rule.options.numRequestsAllowed - numInvocations;
						}
						reply.ruleId = rule.id;
						await rule._executeCallback(reply, input);
					}
				}
				return reply;
			}
		})();
		Object.entries(matchers).forEach(([key, matcher]) => {
			matchers[key] = matcher;
		});

		rateLimiter.addRule(matchers, numRequests, timeInterval);
		return async function (...args) {
			const match = {};

			Object.keys(matchers).forEach((key) => {
				match[key] = args[key];
			});

			rateLimiter.increment(match);
			const rateLimitResult = await rateLimiter.check(match);
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
			match[key] = (...args) => matcher(...args);
		});
		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}
})();
