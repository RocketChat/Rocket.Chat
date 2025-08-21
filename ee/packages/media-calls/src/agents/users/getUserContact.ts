import type { AtLeast, IUser, TypedMediaCallContact } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function getUserContact(
	user: AtLeast<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>,
): Promise<TypedMediaCallContact<'user'>> {
	return {
		type: 'user',
		id: user._id,
		displayName: user.name,
		username: user.username,
		sipExtension: user.freeSwitchExtension,
	};
}

const projection = { username: 1, name: 1, freeSwitchExtension: 1 };

async function mapFindPromiseToContact(
	findPromise: Promise<AtLeast<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'> | null>,
): Promise<TypedMediaCallContact<'user'> | null> {
	const user = await findPromise;

	if (!user) {
		return null;
	}

	return getUserContact(user);
}

export async function getUserContactById(userId: string): Promise<TypedMediaCallContact<'user'> | null> {
	return mapFindPromiseToContact(Users.findOneById(userId, { projection }));
}

export async function getUserContactByExtension(sipExtension: string): Promise<TypedMediaCallContact<'user'> | null> {
	return mapFindPromiseToContact(Users.findOneByFreeSwitchExtension(sipExtension, { projection }));
}
