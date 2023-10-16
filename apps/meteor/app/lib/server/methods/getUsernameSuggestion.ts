import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { generateUsernameSuggestion } from '../functions/getUsernameSuggestion';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUsernameSuggestion(): Promise<string | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async getUsernameSuggestion() {
		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsernameSuggestion',
			});
		}

		return generateUsernameSuggestion(user);
	},
});
