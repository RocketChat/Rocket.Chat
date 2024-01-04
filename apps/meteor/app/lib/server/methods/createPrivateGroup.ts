import type { ICreatedRoom, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions/createRoom';

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

export const createPrivateGroupMethod = async (
	user: IUser,
	name: string,
	members: string[],
	readOnly = false,
	customFields = {},
	extraData = {},
	excludeSelf = false,
): Promise<
	ICreatedRoom & {
		rid: string;
	}
> => {
	check(name, String);
	check(members, Match.Optional([String]));

	if (!(await hasPermissionAsync(user._id, 'create-p'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
	}

	return createRoom('p', name, user, members, excludeSelf, readOnly, {
		customFields,
		...extraData,
	});
};

Meteor.methods<ServerMethods>({
	async createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		return createPrivateGroupMethod(user, name, members, readOnly, customFields, extraData);
	},
});
