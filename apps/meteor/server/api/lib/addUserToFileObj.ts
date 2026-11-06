import type { IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import { Uploads, Users } from '@rocket.chat/models';

import { normalizeLegacyUfsLocation } from './normalizeLegacyUfsLocation';

const isString = (value: unknown): value is string => typeof value === 'string';

export async function addUserToFileObj(files: IUpload[]): Promise<IUploadWithUser[]> {
	const uids = files.map(({ userId }) => userId).filter(isString);
	const roomIds = files.map(({ rid }) => rid).filter(isString);

	const [users, thumbnails] = await Promise.all([
		Users.findByIds(uids, { projection: { name: 1, username: 1 } }).toArray(),
		roomIds.length
			? Uploads.find<IUpload & { originalFileId: string }>(
					{ rid: { $in: roomIds }, originalFileId: { $in: files.map(({ _id }) => _id) }, typeGroup: 'thumb' },
					{ projection: { originalFileId: 1, rid: 1, name: 1, path: 1 } },
				).toArray()
			: [],
	]);
	const usersById = new Map(users.map((user) => [user._id, user]));
	const thumbnailsByFileId = new Map(thumbnails.map((thumbnail) => [thumbnail.originalFileId, normalizeLegacyUfsLocation(thumbnail)]));

	return files.map((upload) => {
		const file = normalizeLegacyUfsLocation(upload);
		const user = file.userId ? usersById.get(file.userId) : undefined;
		const thumbnail = thumbnailsByFileId.get(file._id);
		return {
			...file,
			...(user && { user }),
			...(file.rid && thumbnail?.rid === file.rid && thumbnail.path && { thumbnailUrl: thumbnail.path }),
		};
	});
}
