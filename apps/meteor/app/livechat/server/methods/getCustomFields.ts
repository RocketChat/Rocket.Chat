import { Meteor } from 'meteor/meteor';
import { LivechatCustomField } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ILivechatCustomField } from '@rocket.chat/core-typings';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getCustomFields'(): ILivechatCustomField[];
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getCustomFields'() {
		methodDeprecationLogger.warn('livechat:getCustomFields will be deprecated in future versions of Rocket.Chat');
		return LivechatCustomField.find().toArray();
	},
});
