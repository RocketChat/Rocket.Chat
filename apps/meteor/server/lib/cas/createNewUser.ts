import type { IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import { pick } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';

import { logger } from './logger';
import { createRoom } from '../../../app/lib/server/functions/createRoom';

type CASUserOptions = {
	attributes: Record<string, string | undefined>;
	casVersion: number;
	flagEmailAsVerified: boolean;
};

export const createNewUser = async (username: string, { attributes, casVersion, flagEmailAsVerified }: CASUserOptions): Promise<IUser> => {
	// Define new user
	const newUser = {
		username: attributes.username || username,
		active: true,
		globalRoles: ['user'],
		emails: [attributes.email]
			.filter((e) => e)
			.map((address) => ({
				address,
				verified: flagEmailAsVerified,
			})),
		services: {
			cas: {
				external_id: username,
				version: casVersion,
				attrs: attributes,
			},
		},
		...pick(attributes, 'name'),
	};

	// Create the user
	logger.debug({ msg: 'User does not exist yet, creating it', username });
	const userId = await Accounts.insertUserDoc({}, newUser);

	// Fetch and use it
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Error('Unexpected error: Unable to find user after its creation.');
	}

	logger.debug({ msg: 'Created new user', username, userId: user._id });

	logger.debug({ msg: 'Joining user to attribute channels', rooms: attributes.rooms });
	if (attributes.rooms) {
		const roomNames = attributes.rooms.split(',');
		for await (const roomName of roomNames) {
			if (roomName) {
				let room = await Rooms.findOneByNameAndType(roomName, 'c');
				if (!room) {
					room = await createRoom('c', roomName, user);
				}
			}
		}
	}

	return user;
};
