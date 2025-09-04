import type { ServerMethods } from '@rocket.chat/ddp-client';
import { getUnitsFromUser } from '@rocket.chat/omni-core-ee';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getUnitsFromUser'(): Promise<string[] | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getUnitsFromUser'(): Promise<string[] | undefined> {
		methodDeprecationLogger.method('livechat:getUnitsFromUser', '8.0.0', 'This functionality is no longer supported');
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}
		return getUnitsFromUser(userId);
	},
});
