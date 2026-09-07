import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import type { DoneCallback, Profile } from 'passport';

export const verifyFunction = async (
	accessToken: string,
	refreshToken: string,
	profile: Profile,
	done: DoneCallback,
	serviceName: string,
) => {
	try {
		const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string; email?: string; name?: string };
		const { _json, _raw, ...restProfile } = profileWithRaw;
		const email = profile?.emails?.[0]?.value || profileWithRaw.email || (typeof _json?.email === 'string' ? _json.email : undefined);
		const name = profile.displayName || profileWithRaw.name;

		const user = await Accounts.updateOrCreateUserFromExternalService(
			serviceName,
			{
				accessToken,
				refreshToken,
				...profile,
				...restProfile,
				..._json,
				...(name ? { name } : {}),
				...(email ? { email } : {}),
			},
			{},
		);

		if (!user?.userId || typeof user?.userId !== 'string') {
			return done(new Error('User not found'));
		}

		const userFromDB = await Users.findOneById(user.userId);

		if (!userFromDB) {
			return done(new Error('User not found'));
		}

		return done(null, userFromDB);
	} catch (error) {
		return done(error as Error);
	}
};
