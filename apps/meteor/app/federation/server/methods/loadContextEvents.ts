import type { IFederationEvent } from '@rocket.chat/core-typings';
import { FederationRoomEvents } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'federation:loadContextEvents'(latestEventTimestamp: number): IFederationEvent[];
	}
}

Meteor.methods<ServerMethods>({
	'federation:loadContextEvents': async (latestEventTimestamp) => {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'loadContextEvents' });
		}

		if (!(await hasPermissionAsync(uid, 'view-federation-data'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'loadContextEvents',
			});
		}

		return FederationRoomEvents.find({ timestamp: { $gt: new Date(latestEventTimestamp) } }, { sort: { timestamp: 1 } }).toArray();
	},
});
