import type { IUser } from '@rocket.chat/core-typings';
import { extractDomainFromId, federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';

type MatrixProfile = {
	displayname: string;
	avatar_url?: string;
};

// Only users this homeserver owns have a profile here: native users and application service users.
// Users mirrored from remote homeservers are excluded.
const findProfileOwner = (username: string) =>
	Users.findOne<Pick<IUser, 'username' | 'name' | 'avatarETag'>>(
		{
			username,
			$or: [{ federated: { $exists: false } }, { federated: false }, { 'federation.asId': { $exists: true } }],
		},
		{ projection: { username: 1, name: 1, avatarETag: 1 } },
	);

/**
 * Matrix profile of a user on this homeserver, or null when the user id belongs to another
 * homeserver or no such local user exists.
 */
export async function getLocalUserProfile(userId: string): Promise<MatrixProfile | null> {
	const serverName = federationSDK.getConfig('serverName');
	if (extractDomainFromId(userId) !== serverName) {
		return null;
	}

	// application service users are stored under their full user id, native users under the localpart
	const localpart = userId.split(':')[0].slice(1);
	const user = (await findProfileOwner(userId)) ?? (await findProfileOwner(localpart));
	if (!user?.username) {
		return null;
	}

	return {
		...(user.avatarETag && { avatar_url: `mxc://${serverName}/${user.avatarETag}` }),
		displayname: user.name || user.username,
	};
}
