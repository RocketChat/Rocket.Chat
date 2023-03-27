import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ICreatedRoom } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createPrivateGroup(
			name: string,
			members: string[],
			readOnly?: boolean,
			customFields?: Record<string, unknown>,
			extraData?: Record<string, unknown>,
		): ICreatedRoom;
	}
}

Meteor.methods<ServerMethods>({
	async createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		if (!(await hasPermissionAsync(uid, 'create-p'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		return createRoom('p', name, Meteor.user()?.username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
