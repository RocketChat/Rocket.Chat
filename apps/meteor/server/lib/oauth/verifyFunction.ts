import { Users } from '@rocket.chat/models';
import type { DoneCallback, Profile } from 'passport';

import { updateOrCreateUserFromExternalService } from '../auth/updateOrCreateUserFromExternalService';

export const verifyFunction = async (
	accessToken: string,
	refreshToken: string,
	profile: Profile,
	done: DoneCallback,
	serviceName: string,
) => {
	const profileWithRaw = profile as Profile & { _json?: Record<string, unknown>; _raw?: string; email?: string };
	const { _json, _raw, ...restProfile } = profileWithRaw;

	let user;
	try {
		user = await updateOrCreateUserFromExternalService(
			serviceName,
			{
				accessToken,
				refreshToken,
				...profile,
				...restProfile,
				..._json,
				email: profile?.emails?.[0]?.value ?? restProfile.email,
				name: profile.displayName || profile.name,
			},
			{},
		);
	} catch (error) {
		return done(error);
	}

	if (!user?.userId || typeof user?.userId !== 'string') {
		return done(new Error('User not found'));
	}

	const userFromDB = await Users.findOneById(user.userId);

	if (!userFromDB) {
		return done(new Error('User not found'));
	}

	return done(null, userFromDB);
};
