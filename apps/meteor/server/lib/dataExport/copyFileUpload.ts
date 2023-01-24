import { Uploads } from '@rocket.chat/models';
import type { FileProp } from '@rocket.chat/core-typings';

import { FileUpload } from '../../../app/file-upload/server';
import { joinPath } from '../fileUtils';

export const copyFileUpload = async (attachmentData: Pick<FileProp, '_id' | 'name'>, assetsPath: string): Promise<void> => {
	const file = await Uploads.findOneById(attachmentData._id);
	if (!file) {
		return;
	}

	FileUpload.copy(file, joinPath(assetsPath, `${attachmentData._id}-${attachmentData.name}`));
};
