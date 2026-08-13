/**
 * Port of meteor/routepolicy: declares URL prefixes as owned by a subsystem
 * ('network' routes bypass the static/app HTML fallback).
 */
const policies = new Map<string, string>();

export const RoutePolicy = {
	declare(urlPrefix: string, type: string): void {
		if (!urlPrefix.startsWith('/')) {
			throw new Error(`url prefix must begin with '/': ${urlPrefix}`);
		}
		policies.set(urlPrefix, type);
	},

	classify(url: string): string | null {
		for (const [prefix, type] of policies) {
			if (url.startsWith(prefix)) {
				return type;
			}
		}
		return null;
	},

	urlPrefixesFor(type: string): string[] {
		return [...policies.entries()].filter(([, t]) => t === type).map(([prefix]) => prefix);
	},
};
