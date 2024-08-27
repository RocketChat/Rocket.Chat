import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getTagsList'(): ILivechatTag[];
	}
}

Meteor.methods<ServerMethods>({
	'livechat:getTagsList'() {
		methodDeprecationLogger.method('livechat:getTagsList', '7.0.0');
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:getTagsList',
			});
		}

		return callbacks.run('livechat.beforeListTags');
	},
});
