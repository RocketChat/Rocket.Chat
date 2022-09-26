import type { IUpload, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function addUserToFileObj(files: IUpload[]): Promise<(IUpload & { user?: Pick<IUser, '_id' | 'name' | 'username'> })[]> {
	const uids = files.map(({ userId }) => userId).filter(Boolean) as Array<IUser['_id']>;

	const users = await Users.findByIds<Pick<IUser, '_id' | 'name' | 'username'>>(uids, { projection: { name: 1, username: 1 } }).toArray();

	return files.map((file) => {
		if (!file.userId) {
			return file;
		}
		const user = users.find(({ _id: userId }) => userId === file.userId);
		if (!user) {
			return file;
		}
		return {
			...file,
			user,
		};
	});
}
