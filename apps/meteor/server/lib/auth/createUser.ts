import { hashPassword } from '@rocket.chat/account-utils';
import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { insertUser } from './insertUser';
import type { InsertUserOptions, NewUser } from './insertUser';

export type CreateUserOptions = InsertUserOptions & {
	username?: string;
	email?: string;
	password?: string;
};

// Doesn't reveal whether the username or the email is the one taken
const duplicateError = () => new ClientSafeError(403, 'Something went wrong. Please check your credentials.');

const assertNoOtherUserHas = async ({ username, email }: Pick<CreateUserOptions, 'username' | 'email'>, ownUserId?: IUser['_id']) => {
	const projection = { projection: { _id: 1 } };

	if (username) {
		const other = ownUserId
			? await Users.findOneByUsernameIgnoringCaseExceptId(username, ownUserId, projection)
			: await Users.findOneByUsernameIgnoringCase(username, projection);
		if (other) {
			throw duplicateError();
		}
	}

	if (email) {
		const other = ownUserId
			? await Users.findOneByEmailAddressExceptId(email, ownUserId, projection)
			: await Users.findOneByEmailAddress(email, projection);
		if (other) {
			throw duplicateError();
		}
	}
};

export async function createUser(options: CreateUserOptions): Promise<IUser['_id']> {
	const { username, email, password } = options;
	if (!username && !email) {
		throw new ClientSafeError(400, 'Need to set a username or email');
	}

	const user: NewUser = {
		services: password ? { password: { bcrypt: await hashPassword(password) } } : {},
		...(username && { username }),
		...(email && { emails: [{ address: email, verified: false }] }),
	};

	await assertNoOtherUserHas({ username, email });

	const userId = await insertUser(options, user);

	try {
		await assertNoOtherUserHas({ username, email }, userId);
	} catch (error) {
		await Users.removeById(userId);
		throw error;
	}

	return userId;
}
