import type { OmichannelRoutingConfig } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { RoutingManager } from '../lib/RoutingManager';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getRoutingConfig'(): OmichannelRoutingConfig | undefined;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:getRoutingConfig'() {
		methodDeprecationLogger.method('livechat:getRoutingConfig', '8.0.0', 'v1/livechat/config/routing');
		return RoutingManager.getConfig();
	},
});
