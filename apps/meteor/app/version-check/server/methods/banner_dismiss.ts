import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'banner/dismiss'({ id }: { id: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'banner/dismiss'({ id }) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'banner/dismiss' });
		}

		await Users.setBannerReadById(userId, id);
	},
});
