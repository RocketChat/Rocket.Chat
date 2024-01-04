import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatCustomField } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getCustomFields'(): ILivechatCustomField[];
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getCustomFields'() {
		methodDeprecationLogger.method('livechat:getCustomFields', '7.0.0');
		return LivechatCustomField.find().toArray();
	},
});
