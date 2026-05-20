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
	const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string };
	const { _json, _raw, ...restProfile } = profileWithRaw;

	const user = await Accounts.updateOrCreateUserFromExternalService(
		serviceName,
		{
			accessToken,
			refreshToken,
			name: profile.displayName,
			email: profile?.emails?.[0]?.value,
			...profile,
			...restProfile,
			..._json,
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
};
