/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { getAvatarSuggestionForUser } from '../../app/lib/server/functions/getAvatarSuggestionForUser';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async getAvatarSuggestion() {
		methodDeprecationLogger.warn('getAvatarSuggestion will be deprecated in future versions of Rocket.Chat');

		const user = Meteor.user() as IUser | undefined;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion',
			});
		}

		return getAvatarSuggestionForUser(user);
	},
});
