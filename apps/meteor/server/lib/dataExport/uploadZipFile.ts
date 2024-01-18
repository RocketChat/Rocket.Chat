import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { FileUpload } from '../../../app/file-upload/server';

export const uploadZipFile = async (filePath: string, userId: IUser['_id'], exportType: 'json' | 'html'): Promise<any> => {
	const contentType = 'application/zip';
	const { size } = await stat(filePath);

	const user = await Users.findOneById(userId);
	let userDisplayName = userId;
	if (user) {
		userDisplayName = user.name || user.username || userId;
	}

	const utcDate = new Date().toISOString().split('T')[0];
	const fileSuffix = exportType === 'json' ? '-data' : '';

	const newFileName = encodeURIComponent(`${utcDate}-${userDisplayName}${fileSuffix}.zip`);

	const details = {
		userId,
		type: contentType,
		size,
		name: newFileName,
	};

	const stream = createReadStream(filePath);

	const userDataStore = FileUpload.getStore('UserDataFiles');

	const file = await userDataStore.insert(details, stream);

	return file;
};
