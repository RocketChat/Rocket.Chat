import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeSlackBridgeChannelLinks(): { message: string; params: unknown[] };
	}
}

Meteor.methods<ServerMethods>({
	/**
	 * @deprecated Scheduled for removal in 9.0.0. No caller found in this repository — kept for external DDP clients only.
	 */
	async removeSlackBridgeChannelLinks() {
		methodDeprecationLogger.method('removeSlackBridgeChannelLinks', '9.0.0', []);
		const user = await Meteor.userAsync();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeSlackBridgeChannelLinks',
			});
		}

		if (!(await hasPermissionAsync(user._id, 'remove-slackbridge-links'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'removeSlackBridgeChannelLinks',
			});
		}

		if (settings.get('SlackBridge_Enabled') !== true) {
			throw new Meteor.Error('SlackBridge_disabled');
		}

		await Rooms.unsetAllImportIds();

		return {
			message: 'Slackbridge_channel_links_removed_successfully',
			params: [],
		};
	},
});
