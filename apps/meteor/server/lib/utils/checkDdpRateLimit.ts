import { ClientSafeError } from '@rocket.chat/core-services';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

/**
 * Counts a method call or subscription against the DDP rate limits, throwing `too-many-requests` once the caller is over them.
 */
export const checkDdpRateLimit = (input: DDPRateLimiter.Matcher): void => {
	DDPRateLimiter._increment(input);
	const result = DDPRateLimiter._check(input);
	if (!result.allowed) {
		throw new ClientSafeError('too-many-requests', DDPRateLimiter.getErrorMessage(result), {
			timeToReset: result.timeToReset,
		});
	}
};
