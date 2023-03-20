import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:pageVisited'(token: string, room: string, pageInfo: { title: string; location: string }): void;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:pageVisited'(token, room, pageInfo) {
		methodDeprecationLogger.warn('livechat:pageVisited will be deprecated in future versions of Rocket.Chat');
		Livechat.savePageHistory(token, room, pageInfo);
	},
});
