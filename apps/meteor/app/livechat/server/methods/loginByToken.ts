import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatVisitors } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:loginByToken'(token: string): { _id: string } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:loginByToken'(token) {
		methodDeprecationLogger.method('livechat:loginByToken', '7.0.0');
		check(token, String);
		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return {
			_id: visitor._id,
		};
	},
});
