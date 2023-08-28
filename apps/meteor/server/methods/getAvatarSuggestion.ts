import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { getAvatarSuggestionForUser } from '../../app/lib/server/functions/getAvatarSuggestionForUser';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getAvatarSuggestion(): Promise<
			Record<
				string,
				{
					blob: string;
					contentType: string;
					service: string;
					url: string;
				}
			>
		>;
	}
}

Meteor.methods<ServerMethods>({
	async getAvatarSuggestion() {
		methodDeprecationLogger.method('getAvatarSuggestion', '7.0.0');

		const user = (await Meteor.userAsync()) as IUser | undefined;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion',
			});
		}

		return getAvatarSuggestionForUser(user);
	},
});
