import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendSystemMessages(rid: string, user: string | undefined, id: string): void;
	}
}

Meteor.methods<ServerMethods>({
	sendSystemMessages() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendSystemMessages' });
		}

		// deprecated, use REST /v1/chat.otr instead
	},
});
