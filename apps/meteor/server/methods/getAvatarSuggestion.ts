/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';

import { getAvatarSuggestionForUser } from '../../app/lib/server/functions/getAvatarSuggestionForUser';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async getAvatarSuggestion(userId) {
		methodDeprecationLogger.warn('getAvatarSuggestion will be deprecated in future versions of Rocket.Chat');
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion',
			});
		}

		const user = await Users.findOneById(userId);

		return getAvatarSuggestionForUser(user!);
	},
});
