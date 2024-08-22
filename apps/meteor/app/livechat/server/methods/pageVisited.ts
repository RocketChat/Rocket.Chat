import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/LivechatTyped';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:pageVisited'(token: string, room: string, pageInfo: { title: string; location: { href: string }; change: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:pageVisited'(token, room, pageInfo) {
		methodDeprecationLogger.method('livechat:pageVisited', '7.0.0');
		await Livechat.savePageHistory(token, room, pageInfo);
	},
});
