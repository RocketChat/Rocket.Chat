import { createReadStream, promises as fsPromises } from 'fs';

import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../models/server';
import { FileUpload } from '../../file-upload/server';

export const uploadZipFile = async (filePath: string, userId: IUser['_id'], exportType: 'json' | 'html'): Promise<any> => {
	const stat = await fsPromises.stat(filePath);

	const contentType = 'application/zip';
	const { size } = stat;

	const user = Users.findOneById(userId);
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

	const { fd, close } = await fsPromises.open(filePath);

	const stream = createReadStream('', { fd }); // @todo once upgrades to Node.js v16.x, use createReadStream from fs.promises.open

	const userDataStore = FileUpload.getStore('UserDataFiles');

	const file = userDataStore.insertSync(details, stream);

	await close();

	return file;
};
