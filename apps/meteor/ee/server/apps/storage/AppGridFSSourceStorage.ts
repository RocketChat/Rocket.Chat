import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { AppSourceStorage } from '@rocket.chat/apps-engine/server/storage';
import { MongoInternals } from 'meteor/mongo';
import { NpmModuleMongodb } from 'meteor/npm-mongo';
import { ObjectId } from 'mongodb';

import { streamToBuffer } from '../../../../app/file-upload/server/lib/streamToBuffer';

export class AppGridFSSourceStorage extends AppSourceStorage {
	private pathPrefix = 'GridFS:/';

	private bucket: NpmModuleMongodb.GridFSBucket;

	constructor() {
		super();

		const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

		this.bucket = new NpmModuleMongodb.GridFSBucket(db as any, {
			bucketName: 'rocketchat_apps_packages',
			chunkSizeBytes: 1024 * 255,
		});
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<string> {
		return new Promise((resolve, reject) => {
			const filename = this.itemToFilename(item);
			const writeStream: NpmModuleMongodb.GridFSBucketWriteStream = this.bucket
				.openUploadStream(filename)
				.on('finish', () => resolve(this.idToPath(writeStream.id)))
				.on('error', (error: any) => reject(error));

			writeStream.write(zip);
			writeStream.end();
		});
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		return streamToBuffer(this.bucket.openDownloadStream(this.itemToObjectId(item)));
	}

	public async update(item: IAppStorageItem, zip: Buffer): Promise<string> {
		return new Promise((resolve, reject) => {
			const fileId = this.itemToFilename(item);
			const writeStream: NpmModuleMongodb.GridFSBucketWriteStream = this.bucket
				.openUploadStream(fileId)
				.on('finish', () => {
					resolve(this.idToPath(writeStream.id));
					// An error in the following line would not cause the update process to fail
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					this.remove(item).catch(() => {});
				})

				.on('error', (error: any) => reject(error));

			writeStream.write(zip);
			writeStream.end();
		});
	}

	public async remove(item: IAppStorageItem): Promise<void> {
		try {
			await this.bucket.delete(this.itemToObjectId(item));
		} catch (error: any) {
			if (error.message.includes('File not found for id')) {
				console.warn(
					`This instance could not remove the ${item.info.name} app package. If you are running Rocket.Chat in a cluster with multiple instances, possibly other instance removed the package. If this is not the case, it is possible that the file in the database got renamed or removed manually.`,
				);
				return;
			}
			throw error;
		}
	}

	private itemToFilename(item: IAppStorageItem): string {
		return `${item.info.nameSlug}-${item.info.version}.package`;
	}

	private idToPath(id: NpmModuleMongodb.GridFSBucketWriteStream['id']): string {
		return this.pathPrefix + id;
	}

	private itemToObjectId(item: IAppStorageItem): ObjectId {
		return new ObjectId(item.sourcePath?.substring(this.pathPrefix.length));
	}
}
