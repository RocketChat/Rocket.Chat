import type { Profile } from 'passport';

export type ExtendedOAuthProfile = Profile & {
	_json?: Record<string, unknown>;
	_raw?: string;
	email?: string;
	name?: string;
};

export const resolveOAuthProfile = (profile: Profile): Record<string, unknown> => {
	const profileWithRaw = profile as ExtendedOAuthProfile;
	const { _json, _raw, ...restProfile } = profileWithRaw;
	const email = profile?.emails?.[0]?.value || profileWithRaw.email || (typeof _json?.email === 'string' ? _json.email : undefined);
	const name = profile.displayName || profileWithRaw.name;

	return {
		...restProfile,
		..._json,
		...(name ? { name } : {}),
		...(email ? { email } : {}),
	};
};
