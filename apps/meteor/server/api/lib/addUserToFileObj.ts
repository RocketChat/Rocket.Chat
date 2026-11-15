import type { IUpload, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

const isString = (value: unknown): value is string => typeof value === 'string';

export async function addUserToFileObj(files: IUpload[]): Promise<(IUpload & { user?: Pick<IUser, '_id' | 'name' | 'username'> })[]> {
	const uids = files.map(({ userId }) => userId).filter(isString);

	const users = await Users.findByIds(uids, { projection: { name: 1, username: 1 } }).toArray();
	const usersById = new Map(users.map((user) => [user._id, user]));

	return files.map((file) => {
		const user = file.userId ? usersById.get(file.userId) : undefined;
		if (!user) {
			return file;
		}
		return {
			...file,
			user,
		};
	});
}
