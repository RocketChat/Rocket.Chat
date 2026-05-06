import { absoluteUrl } from '../absoluteUrl';

type AbsoluteUrlOptions = Parameters<typeof absoluteUrl>[1];

// Builds the redirect URI used during the OAuth handshake — the URL the
// provider redirects back to once the user authorizes the app.
//
// Replaces `OAuth._redirectUri` from meteor/oauth + the
// `client/meteor/overrides/oauthRedirectUri.ts` monkey-patch which appended
// `?close` to remain compatible with pre-Meteor 2.3 callbacks. The `?close`
// suffix is kept for the same back-compat reason and should be removed on
// the same v5.0.0 cleanup the override flagged.
export const redirectUri = (
	serviceName: string,
	config: { loginStyle?: string } | undefined,
	params?: Record<string, string | number | boolean | undefined | null>,
	absoluteUrlOptions?: AbsoluteUrlOptions,
): string => {
	const base = absoluteUrl(`_oauth/${serviceName}`, absoluteUrlOptions);
	const url = new URL(base);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value === undefined || value === null) continue;
			url.searchParams.set(key, String(value));
		}
	}

	let result = url.toString();

	// DEPRECATED: remove in v5.0.0 — only added when loginStyle isn't pinned
	// (i.e. legacy oauth callbacks that still expect `?close`).
	if (!config?.loginStyle && !result.includes('close')) {
		console.warn(
			`Automatically added ?close to 'redirect_uri' for ${serviceName}, this behavior will be removed in v5.0.0.\n` +
				"Please update your OAuth config to accept both with and without ?close as the 'redirect_uri'.",
		);
		result = `${result}${result.includes('?') ? '&' : '?'}close`;
	}

	return result;
};
