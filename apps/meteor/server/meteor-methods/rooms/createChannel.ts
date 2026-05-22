import type { ITeam } from '@rocket.chat/core-typings';
import { Users, Team } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { createRoom } from '../../lib/rooms/createRoom';

export const createChannelMethod = async (
	userId: string,
	name: string,
	members: string[],
	readOnly = false,
	customFields?: Record<string, any>,
	extraData: Record<string, any> = {},
	excludeSelf = false,
) => {
	check(name, String);
	check(members, Match.Optional([String]));
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
	}

	const user = await Users.findOneById(userId, { projection: { services: 0 } });
	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
	}

	if (extraData.teamId) {
		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(extraData.teamId, { projection: { roomId: 1 } });
		if (!team) {
			throw new Meteor.Error('error-team-not-found', 'The "teamId" param provided does not match any team', { method: 'createChannel' });
		}
		if (!(await hasPermissionAsync(userId, 'create-team-channel', team.roomId))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}
	} else if (!(await hasPermissionAsync(userId, 'create-c'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
	}

	return createRoom('c', name, user, members, excludeSelf, readOnly, {
		...(customFields && Object.keys(customFields).length && { customFields }),
		...extraData,
	});
};
