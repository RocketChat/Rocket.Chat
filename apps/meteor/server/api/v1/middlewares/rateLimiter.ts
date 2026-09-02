import type { MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { RateLimiter } from 'meteor/rate-limit';

import type { CachedSettings } from '../../../settings/CachedSettings';
import type { RateLimiterOptions } from '../../definition';
import { buildRateLimiterInput } from '../../rateLimiterKey';
import type { HonoContext } from '../../router';

export type ResolvedRateLimiter = { key: string; rateLimiter: RateLimiter; options: RateLimiterOptions };

const reasonFor = (timeToReset: number) =>
	`Error, too many requests. Please slow down. You must wait ${Math.ceil(timeToReset / 1000)} seconds before trying this endpoint again.`;

const defaultReject = (reason: string) => ({
	statusCode: 429 as const,
	body: { success: false, error: `${reason} [error-too-many-requests]` },
});

export const rateLimiterMiddleware =
	({
		settings,
		resolve,
		canBypass,
		reject = defaultReject,
	}: {
		settings: CachedSettings;
		resolve: (c: HonoContext) => ResolvedRateLimiter | undefined;
		canBypass: (userId: string) => Promise<boolean>;
		reject?: (reason: string) => { statusCode: ContentfulStatusCode; body: unknown };
	}): MiddlewareHandler =>
	async (c: HonoContext, next) => {
		const limiter = resolve(c);

		if (!limiter) {
			return next();
		}

		if (settings.get<boolean>('API_Enable_Rate_Limiter') !== true) {
			return next();
		}

		if (process.env.NODE_ENV === 'development' && settings.get<boolean>('API_Enable_Rate_Limiter_Dev') !== true) {
			return next();
		}

		const userId = c.get('user')?._id;

		if (userId && (await canBypass(userId))) {
			return next();
		}

		const input = buildRateLimiterInput({ route: limiter.key, IPAddr: c.get('remoteAddress'), userId });

		limiter.rateLimiter.increment(input);
		const attempt = await limiter.rateLimiter.check(input);

		c.res.headers.set('X-RateLimit-Limit', String(limiter.options.numRequestsAllowed ?? ''));
		c.res.headers.set('X-RateLimit-Remaining', String(attempt.numInvocationsLeft));
		c.res.headers.set('X-RateLimit-Reset', String(Date.now() + attempt.timeToReset));

		if (attempt.allowed) {
			return next();
		}

		const { statusCode, body } = reject(reasonFor(attempt.timeToReset));

		return c.json(body, statusCode);
	};
