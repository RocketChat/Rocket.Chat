import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatCustomField } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
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
