import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

export const RateLimiterClass = new (class {
	limitMethod(
		methodName: string,
		numRequests: number,
		timeInterval: number,
		matchers: Record<string, (...args: any[]) => boolean | Promise<boolean>>,
	): string | null {
		if (process.env.TEST_MODE === 'true') {
			return null;
		}
		const match: Record<string, any> = {
			type: 'method',
			name: methodName,
		};
		Object.entries(matchers).forEach(([key, matcher]) => {
			match[key] = (...args: any[]) => matcher(...args);
		});
		return DDPRateLimiter.addRule(match, numRequests, timeInterval);
	}
})();
