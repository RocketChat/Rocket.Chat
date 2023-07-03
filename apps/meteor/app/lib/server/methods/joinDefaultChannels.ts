import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { addUserToDefaultChannels } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		joinDefaultChannels(silenced?: boolean): void;
	}
}

Meteor.methods<ServerMethods>({
	async joinDefaultChannels(silenced) {
		check(silenced, Match.Optional(Boolean));
		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'joinDefaultChannels',
			});
		}
		return addUserToDefaultChannels(user as IUser, Boolean(silenced));
	},
});
