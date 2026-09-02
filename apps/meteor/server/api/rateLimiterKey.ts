import type { RateLimiterOptionsToCheck, RateLimiterRule } from 'meteor/rate-limit';

import type { RateLimiterSubject } from './definition';

export const buildRateLimiterRule = (route: string, per: RateLimiterSubject = 'ip'): RateLimiterRule =>
	per === 'user' ? { userId: (input: string) => input, route } : { IPAddr: (input: string) => input, route };

export const buildRateLimiterInput = ({
	route,
	IPAddr,
	userId,
}: {
	route: string;
	IPAddr: string;
	userId?: string;
}): RateLimiterOptionsToCheck => ({
	IPAddr,
	route,
	userId: userId || `ip:${IPAddr}`,
});
