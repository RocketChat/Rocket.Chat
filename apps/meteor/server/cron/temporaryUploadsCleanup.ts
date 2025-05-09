import { cronJobs } from '@rocket.chat/cron';
import { Uploads } from '@rocket.chat/models';

import { FileUpload } from '../../app/file-upload/server';

async function temporaryUploadCleanup(): Promise<void> {
	const files = await Uploads.findExpiredTemporaryFiles({ projection: { _id: 1 } }).toArray();

	for await (const file of files) {
		await FileUpload.getStore('Uploads').deleteById(file._id);
	}
}

export async function temporaryUploadCleanupCron(): Promise<void> {
	return cronJobs.add('temporaryUploadCleanup', '31 * * * *', async () => temporaryUploadCleanup());
}
