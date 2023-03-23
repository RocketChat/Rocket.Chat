import type { IStats } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { getLastStatistics } from '../functions/getLastStatistics';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getStatistics(refresh?: boolean): IStats;
	}
}

Meteor.methods<ServerMethods>({
	async getStatistics(refresh) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getStatistics' });
		}
		return getLastStatistics({
			userId: uid,
			refresh,
		});
	},
});
