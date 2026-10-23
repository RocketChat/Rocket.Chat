import { ClientSafeError } from '@rocket.chat/core-services';
import type { ICreateRoomParams } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, ICreatedRoom, IUser, ITeam } from '@rocket.chat/core-typings';
import { Team } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';

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
	abacAttributes?: IAbacAttributeDefinition[],
	options?: ICreateRoomParams['options'],
): Promise<
	ICreatedRoom & {
		rid: string;
		skippedMembers?: string[];
	}
> => {
	check(name, String);
	check(members, Match.Optional([String]));

	if (extraData.teamId) {
		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(extraData.teamId, { projection: { roomId: 1 } });
		if (!team) {
			throw new ClientSafeError('error-team-not-found', 'The "teamId" param provided does not match any team', {
				method: 'createPrivateGroup',
			});
		}
		if (!(await hasPermissionAsync(user, 'create-team-group', team.roomId))) {
			throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}
	} else if (!(await hasPermissionAsync(user, 'create-p'))) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
	}

	const { abacAttributes: _untrustedAbacAttributes, ...roomExtraData } = extraData;

	return createRoom(
		'p',
		name,
		user,
		members,
		excludeSelf,
		readOnly,
		{
			...(customFields && Object.keys(customFields).length && { customFields }),
			...roomExtraData,
			...(abacAttributes && { abacAttributes }),
		},
		options,
	);
};
