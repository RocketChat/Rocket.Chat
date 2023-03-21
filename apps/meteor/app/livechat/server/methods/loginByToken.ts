import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:loginByToken'(token: string): { _id: string } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:loginByToken'(token) {
		methodDeprecationLogger.warn('livechat:loginByToken will be deprecated in future versions of Rocket.Chat');
		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return {
			_id: visitor._id,
		};
	},
});
