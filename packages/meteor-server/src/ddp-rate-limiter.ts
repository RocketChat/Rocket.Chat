/* Port of meteor/ddp-rate-limiter (packages/ddp-rate-limiter/ddp-rate-limiter.js @ METEOR@3.4.1) */
import type { RateLimiterReply } from './rate-limit.ts';
import { RateLimiter } from './rate-limit.ts';

type ErrorMessage = string | ((rateLimitResult: RateLimiterReply) => string);

let errorMessage: ErrorMessage = (rateLimitResult) =>
	`Error, too many requests. Please slow down. You must wait ${Math.ceil(rateLimitResult.timeToReset / 1000)} seconds before trying again.`;

// Store rule specific error messages.
const errorMessageByRule = new Map<string, ErrorMessage>();

const rateLimiter = new RateLimiter();

export const DDPRateLimiter = {
	getErrorMessage(rateLimitResult: RateLimiterReply): string {
		// If there is a specific error message for this rule, use it.
		if (rateLimitResult.ruleId && errorMessageByRule.has(rateLimitResult.ruleId)) {
			const message = errorMessageByRule.get(rateLimitResult.ruleId)!;
			if (typeof message === 'function') {
				return message(rateLimitResult);
			}
			return message;
		}

		// Otherwise, use the default error message.
		if (typeof errorMessage === 'function') {
			return errorMessage(rateLimitResult);
		}
		return errorMessage;
	},

	setErrorMessage(message: ErrorMessage): void {
		errorMessage = message;
	},

	setErrorMessageOnRule(ruleId: string, message: ErrorMessage): void {
		errorMessageByRule.set(ruleId, message);
	},

	addRule: rateLimiter.addRule.bind(rateLimiter),

	printRules: () => rateLimiter.rules,

	removeRule: (id: string) => rateLimiter.removeRule(id),

	_increment: (input: Record<string, any>) => {
		rateLimiter.increment(input);
	},

	_incrementRules: rateLimiter.incrementRules.bind(rateLimiter),

	_check: (input: Record<string, any>) => rateLimiter.check(input),

	findAllMatchingRulesAsync: (input: Record<string, any>) => rateLimiter._findAllMatchingRulesAsync(input),

	_checkRules: rateLimiter.checkRules.bind(rateLimiter),
};
