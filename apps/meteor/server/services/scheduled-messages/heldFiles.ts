import type { IScheduledMessage } from '@rocket.chat/core-typings';

import { FileUpload } from '../../lib/media/file-upload';

export const deleteHeldFiles = async (files: IScheduledMessage['files']): Promise<void> => {
	for await (const { _id } of files ?? []) {
		await FileUpload.getStore('Uploads').deleteById(_id);
	}
};
