import type { ICreatedRoom, IUser, ITeam } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users, Team } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions/createRoom';

declare module '@rocket.chat/ddp-client' {
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
	customFields?: Record<string, any>,
	extraData: Record<string, any> = {},
	excludeSelf = false,
): Promise<
	ICreatedRoom & {
		rid: string;
	}
> => {
	check(name, String);
	check(members, Match.Optional([String]));

	if (extraData.teamId) {
		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(extraData.teamId, { projection: { roomId: 1 } });
		if (!team) {
			throw new Meteor.Error('error-team-not-found', 'The "teamId" param provided does not match any team', {
				method: 'createPrivateGroup',
			});
		}
		if (!(await hasPermissionAsync(user._id, 'create-team-group', team.roomId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}
	} else if (!(await hasPermissionAsync(user._id, 'create-p'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
	}

	return createRoom('p', name, user, members, excludeSelf, readOnly, {
		...(customFields && Object.keys(customFields).length && { customFields }),
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

		const user = await Users.findOneById(uid, { projection: { services: 0 } });
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		return createPrivateGroupMethod(user, name, members, readOnly, customFields, extraData);
	},
});
