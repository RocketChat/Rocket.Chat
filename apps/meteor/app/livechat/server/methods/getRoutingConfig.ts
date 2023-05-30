import type { OmichannelRoutingConfig } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { RoutingManager } from '../lib/RoutingManager';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getRoutingConfig'(): OmichannelRoutingConfig | undefined;
	}
}

Meteor.methods<ServerMethods>({
	'livechat:getRoutingConfig'() {
		return RoutingManager.getConfig();
	},
});
