import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ICreatedRoom } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createChannel(
			name: string,
			members: string[],
			readOnly?: boolean,
			customFields?: Record<string, any>,
			extraData?: Record<string, any>,
		): ICreatedRoom;
	}
}

Meteor.methods<ServerMethods>({
	async createChannel(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		const uid = Meteor.userId();

		const user = Meteor.user();

		if (!uid || !user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!(await hasPermissionAsync(uid, 'create-c'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}
		return createRoom('c', name, user.username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
