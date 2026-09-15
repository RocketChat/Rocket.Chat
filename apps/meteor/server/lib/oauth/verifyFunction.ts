import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import type { DoneCallback, Profile } from 'passport';

import { resolveOAuthProfile } from './resolveOAuthProfile';

export const verifyFunction = async (
	accessToken: string,
	refreshToken: string,
	profile: Profile,
	done: DoneCallback,
	serviceName: string,
) => {
	try {
		const serviceData = resolveOAuthProfile(profile);

		const user = await Accounts.updateOrCreateUserFromExternalService(
			serviceName,
			{
				accessToken,
				refreshToken,
				...serviceData,
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
