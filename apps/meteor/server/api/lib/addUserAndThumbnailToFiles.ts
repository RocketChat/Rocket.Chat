import type { IUpload, IUploadWithUser } from '@rocket.chat/core-typings';
import { Uploads, Users } from '@rocket.chat/models';

import { normalizeLegacyUfsLocation } from './normalizeLegacyUfsLocation';

const isString = (value: unknown): value is string => typeof value === 'string';

export async function addUserAndThumbnailToFiles(files: IUpload[]): Promise<IUploadWithUser[]> {
	const uids = files.map(({ userId }) => userId).filter(isString);
	const imageIds = files.filter(({ typeGroup }) => typeGroup === 'image').map(({ _id }) => _id);

	const [users, thumbnails] = await Promise.all([
		Users.findByIds(uids, { projection: { name: 1, username: 1 } }).toArray(),
		imageIds.length
			? Uploads.findThumbnailsByOriginalFileIds<IUpload & { originalFileId: string }>(imageIds, {
					projection: { originalFileId: 1, rid: 1, name: 1, path: 1 },
				}).toArray()
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
			...(file.rid && thumbnail?.rid === file.rid && thumbnail.path && { thumbnailPath: thumbnail.path }),
		};
	});
}
