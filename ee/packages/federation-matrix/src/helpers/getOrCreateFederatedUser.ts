import type { IUser, RequiredField } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import { createOrUpdateFederatedUser } from './createOrUpdateFederatedUser';
import { getUsernameServername } from './getUsernameServername';
import { validateFederatedUsername } from './validateFederatedUsername';

const logger = new Logger('federation-matrix:user');

/**
 * `name` is deliberately not required: Rocket.Chat users are valid with a username and no
 * display name (`Accounts_RequireNameForSignUp` off), so demanding it would drop membership
 * events for nameless local users. Consumers must fall back to the username when displaying.
 */
type FederatedUser = RequiredField<IUser, 'username'>;

const hasUsername = (user: IUser): user is FederatedUser => user.username !== undefined;

/**
 * Resolves the local user for a Matrix user id, creating it on first contact.
 *
 * Only the last branch creates anything: once a user exists locally every later call
 * short-circuits on the lookup, which is why a broken creation path only ever surfaces
 * on the very first interaction with a given remote user.
 */
export async function getOrCreateFederatedUser(userId: string): Promise<FederatedUser> {
	try {
		const serverName = federationSDK.getConfig('serverName');
		const [username, userServerName, isLocal] = getUsernameServername(userId, serverName);

		const user = await Users.findOneByUsername(username);
		if (user) {
			if (!hasUsername(user)) {
				throw new Error(`User ${username} has no username for Matrix ID: ${userId}`);
			}
			return user;
		}

		const as = federationSDK.getAppServiceForUser(userId);
		if (as) {
			const user = await Users.findOneByUsername(userId);
			if (!user) {
				throw new Error('AppService user not found for creating user');
			}
			if (!hasUsername(user)) {
				throw new Error(`AppService user ${userId} has no username`);
			}
			return user;
		}

		if (isLocal) {
			throw new Error(`Local user ${username} not found for Matrix ID: ${userId}`);
		}

		if (!validateFederatedUsername(userId)) {
			throw new Error(`Invalid federated Matrix ID: ${userId}`);
		}

		// awaited so a failure is logged with context and wrapped, instead of escaping the catch below
		return await createOrUpdateFederatedUser({
			username: userId,
			name: userId,
			origin: userServerName,
		});
	} catch (err) {
		logger.error({ msg: 'Error getting or creating federated user', err, userId });
		throw new Error(`Error getting or creating federated user ${userId}`, { cause: err });
	}
}
