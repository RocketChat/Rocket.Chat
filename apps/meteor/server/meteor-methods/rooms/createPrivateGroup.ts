import type { ICreatedRoom, IUser, ITeam } from '@rocket.chat/core-typings';
import { Team } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { createRoom } from '../../lib/rooms/createRoom';

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
		if (!(await hasPermissionAsync(user, 'create-team-group', team.roomId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}
	} else if (!(await hasPermissionAsync(user, 'create-p'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
	}

	return createRoom('p', name, user, members, excludeSelf, readOnly, {
		...(customFields && Object.keys(customFields).length && { customFields }),
		...extraData,
	});
};
