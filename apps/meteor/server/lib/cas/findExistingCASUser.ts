import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';

export const findExistingCASUser = async (username: string): Promise<IUser | undefined> => {
	const casUser = await Users.findOne({ 'services.cas.external_id': username });
	if (casUser) {
		return casUser;
	}

	if (!settings.get<boolean>('CAS_trust_username')) {
		return;
	}

	// If that user was not found, check if there's any Rocket.Chat user with that username
	// With this, CAS login will continue to work if the user is renamed on both sides and also if the user is renamed only on Rocket.Chat.
	// It'll also allow non-CAS users to switch to CAS based login
	// #TODO: Remove regex based search
	const regex = new RegExp(`^${username}$`, 'i');
	const user = await Users.findOne({ regex });
	if (user) {
		// Update the user's external_id to reflect this new username.
		await Users.updateOne({ _id: user._id }, { $set: { 'services.cas.external_id': username } });
		return user;
	}
};
