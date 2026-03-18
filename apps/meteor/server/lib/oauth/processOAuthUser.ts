import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import type { CustomOAuthOptions } from './passport/types';
import { client } from '../../database/utils';
import { callbacks } from '../callbacks';
import { saveUserIdentity } from '../../../app/lib/server/functions/saveUserIdentity';
import { notifyOnUserChange } from '../../../app/lib/server/lib/notifyListener';

const logger = new Logger('processOAuthUser');

export async function processOAuthUser(
	serviceName: string,
	serviceData: Record<string, unknown>,
	options: CustomOAuthOptions,
): Promise<void> {
	const username = serviceData.username as string | undefined;
	const email = serviceData.email as string | undefined;
	const id = serviceData.id as string;
	const name = serviceData.name as string | undefined;

	if (!username && !email) {
		logger.debug({ msg: 'No username or email in service data, skipping user processing', serviceName });
		return;
	}

	let user;
	const keyField = options.keyField || 'username';
	const mergeUsersDistinctServices = options.mergeUsersDistinctServices ?? false;

	if (keyField === 'username' && username) {
		user = mergeUsersDistinctServices
			? await Users.findOneByUsernameIgnoringCase(username)
			: await Users.findOneByUsernameAndServiceNameIgnoringCase(username, id, serviceName);
	} else if (keyField === 'email' && email) {
		user = mergeUsersDistinctServices
			? await Users.findOneByEmailAddress(email)
			: await Users.findOneByEmailAddressAndServiceNameIgnoringCase(email, id, serviceName);
	}

	if (!user) {
		logger.debug({ msg: 'No existing user found', serviceName, keyField });
		return;
	}

	await callbacks.run('afterProcessOAuthUser', { serviceName, serviceData, user });

	const serviceIdKey = `services.${serviceName}.id`;
	const existingServiceId = user.services?.[serviceName]?.id;

	const hasIdenticalServiceData =
		existingServiceId === id &&
		user.name === name &&
		(keyField === 'email' || !email || user.emails?.find(({ address }) => address === email));

	if (hasIdenticalServiceData) {
		logger.debug({ msg: 'User already has identical service data', serviceName, userId: user._id });
		return;
	}

	const mergeUsers = options.mergeUsers ?? false;

	if (!mergeUsers) {
		throw new Meteor.Error('CustomOAuth', `User with ${keyField} ${keyField === 'username' ? username : email} already exists`);
	}

	const successCallbacks: Array<() => Promise<void>> = [
		async () => {
			const updatedUser = await Users.findOneById(user._id, { projection: { name: 1, emails: 1, [serviceIdKey]: 1 } });
			if (updatedUser) {
				const { _id, ...diff } = updatedUser;
				void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff });
			}
		},
	];

	const session = client.startSession();

	try {
		Object.assign(session, {
			onceSuccesfulCommit: (cb: () => Promise<void>) => {
				successCallbacks.push(cb);
			},
		});

		session.startTransaction();

		const updater = Users.getUpdater();

		if (keyField === 'username' && email) {
			updater.set('emails', [{ address: email, verified: true }]);
		}

		updater.set(serviceIdKey, id);

		await saveUserIdentity({
			_id: user._id,
			name,
			updater,
			session,
			updateUsernameInBackground: true,
			username: user.username,
		});

		await Users.updateFromUpdater({ _id: user._id }, updater, { session });

		await session.commitTransaction();

		logger.info({ msg: 'User merged successfully', serviceName, userId: user._id });
	} catch (e) {
		await session.abortTransaction();
		logger.error({ msg: 'Error merging user', serviceName, error: e });
		throw e;
	} finally {
		await session.endSession();
	}

	void Promise.allSettled(successCallbacks.map((cb) => cb()));
}
