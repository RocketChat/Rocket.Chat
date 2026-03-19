import { cronJobs } from '@rocket.chat/cron';
import { Uploads } from '@rocket.chat/models';
import { Logger } from '@rocket.chat/logger';
import { FileUpload } from '../../app/file-upload/server';

const log = new Logger('TemporaryUploadsCleanup');

async function temporaryUploadCleanup(): Promise<void> {
	const cursor = Uploads.findExpiredTemporaryFiles({ projection: { _id: 1 } });

	const store = FileUpload.getStore('Uploads');
	const BATCH_SIZE = 50;
	let batch = [];

	const processBatch = async (currentBatch: any[]) => {
		const results = await Promise.allSettled(currentBatch.map((f) => store.deleteById(f._id)));

		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				log.error({
					msg: 'Failed to delete expired temporary file',
					fileId: currentBatch[index]._id,
					err: result.reason
				});
			}
		});
	};

	for await (const file of cursor) {
		batch.push(file);

		if (batch.length >= BATCH_SIZE) {
			await processBatch(batch);
			batch = [];
		}
	}

	if (batch.length > 0) {
		await processBatch(batch);
	}
}

export async function temporaryUploadCleanupCron(): Promise<void> {
	return cronJobs.add('temporaryUploadCleanup', '31 * * * *', async () => temporaryUploadCleanup());
}