import type { IUpload, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

const isString = (value: unknown): value is string => typeof value === 'string';

export async function addUserToFileObj(files: IUpload[]): Promise<(IUpload & { user?: Pick<IUser, '_id' | 'name' | 'username'> })[]> {
	const uids = files.map(({ userId }) => userId).filter(isString);

	const users = await Users.findByIds(uids, { projection: { name: 1, username: 1 } }).toArray();

	return files.map((file) => {
		const user = users.find(({ _id: userId }) => file.userId && userId === file.userId);
		if (!user) {
			return file;
		}
		return {
			...file,
			user,
		};
	});
}
