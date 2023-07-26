import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:pageVisited'(token: string, room: string, pageInfo: { title: string; location: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:pageVisited'(token, room, pageInfo) {
		methodDeprecationLogger.method('livechat:pageVisited', '7.0.0');
		await Livechat.savePageHistory(token, room, pageInfo);
	},
});
