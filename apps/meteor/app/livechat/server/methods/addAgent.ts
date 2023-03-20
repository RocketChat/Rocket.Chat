import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addAgent'(username: string): void;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:addAgent'(username) {
		const uid = Meteor.userId();
		methodDeprecationLogger.warn('livechat:addAgent will be deprecated in future versions of Rocket.Chat');
		if (!uid || !hasPermission(uid, 'manage-livechat-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		return Livechat.addAgent(username);
	},
});
